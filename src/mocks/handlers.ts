import { HttpResponse, http } from 'msw'
import { API_BASE_URL } from '../services/http/httpClient.ts'
import type {
  SummaryResponseDto,
  TransactionDetailDto,
  TransactionDetailResponseDto,
  TransactionDto,
  TransactionListResponseDto,
} from '../types/api.ts'
import { PERIODS } from '../types/domain.ts'
import type { Period } from '../types/domain.ts'
import { isOneOf } from '../utils/typeGuards.ts'
import { calculateBalance, summarizeCashFlow } from './cashFlow.ts'
import { OPENING_BALANCE, createFixtures } from './fixtures.ts'
import { getPeriodStart, isWithinPeriod } from './period.ts'

const isPeriod = isOneOf(PERIODS)

const toTransactionDto = ({
  id,
  dateTime,
  type,
  description,
  amount,
  currency,
  status,
}: TransactionDetailDto): TransactionDto => ({ id, dateTime, type, description, amount, currency, status })

interface MockDatabaseOptions {
  /** Transacciones ordenadas por fecha descendente. */
  fixtures: readonly TransactionDetailDto[]
  now: () => Date
}

/** Backend simulado: aplica RN-02 sobre las fixtures y expone los 3 endpoints del SPEC. */
export const createHandlers = ({ fixtures, now }: MockDatabaseOptions) => {
  /** RN-02: saldo antes de una fecha, considerando todas las transacciones previas. */
  const balanceBefore = (date: Date): number => {
    const previous = fixtures.filter(({ dateTime }) => new Date(dateTime) < date)
    const { totalIncome, totalExpense } = summarizeCashFlow(previous)
    return calculateBalance(OPENING_BALANCE, totalIncome, totalExpense)
  }

  const transactionsInPeriod = (period: Period, currentDate: Date) =>
    fixtures.filter(({ dateTime }) => isWithinPeriod(new Date(dateTime), period, currentDate))

  const readPeriod = (request: Request): Period | null => {
    const period = new URL(request.url).searchParams.get('period')
    return isPeriod(period) ? period : null
  }

  const invalidPeriod = () =>
    HttpResponse.json({ message: 'El parámetro period debe ser daily, weekly o monthly' }, { status: 400 })

  return [
    http.get(`${API_BASE_URL}/dashboard/summary`, ({ request }) => {
      const period = readPeriod(request)
      if (!period) return invalidPeriod()

      const currentDate = now()
      const transactions = transactionsInPeriod(period, currentDate)
      const previousBalance = balanceBefore(getPeriodStart(period, currentDate))
      const { totalIncome, totalExpense } = summarizeCashFlow(transactions)

      return HttpResponse.json<SummaryResponseDto>({
        period,
        previousBalance,
        currentBalance: calculateBalance(previousBalance, totalIncome, totalExpense),
        transactionCount: transactions.length,
        pendingCount: transactions.filter(({ status }) => status === 'PENDING').length, // DP-12
        totalIncome,
        totalExpense,
      })
    }),

    // Debe registrarse antes de `/transaction/:id` para que `list` no se interprete como un id.
    http.get(`${API_BASE_URL}/dashboard/transaction/list`, ({ request }) => {
      const period = readPeriod(request)
      if (!period) return invalidPeriod()

      const currentDate = now()

      return HttpResponse.json<TransactionListResponseDto>({
        previousBalance: balanceBefore(getPeriodStart(period, currentDate)),
        items: transactionsInPeriod(period, currentDate).map(toTransactionDto), // A3: descendente
      })
    }),

    http.get(`${API_BASE_URL}/dashboard/transaction/:id`, ({ params }) => {
      const transaction = fixtures.find(({ id }) => id === params.id)
      if (!transaction) {
        return HttpResponse.json({ message: 'Transacción no encontrada' }, { status: 404 })
      }

      return HttpResponse.json<TransactionDetailResponseDto>({
        previousBalance: balanceBefore(new Date(transaction.dateTime)),
        transaction,
      })
    }),
  ]
}

/** Handlers con datos relativos al momento en que se carga la aplicación (DP-4). */
export const handlers = createHandlers({
  fixtures: createFixtures(new Date()),
  now: () => new Date(),
})
