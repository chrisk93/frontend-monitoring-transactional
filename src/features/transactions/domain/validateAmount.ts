import { MAX_TRANSACTION_AMOUNT } from '../../../shared/constants.ts'

/**
 * RN-01: un monto es válido si es un número finito, no negativo y no supera el máximo por transacción.
 */
export const validateAmount = (amount: number): boolean =>
  Number.isFinite(amount) && amount >= 0 && amount <= MAX_TRANSACTION_AMOUNT
