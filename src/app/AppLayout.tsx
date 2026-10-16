import { Outlet } from 'react-router'
import styles from './AppLayout.module.scss'

export const AppLayout = () => (
  <div className={styles['app-layout']}>
    <header className={styles['app-layout__header']}>
      <h1 className={styles['app-layout__title']}>Dashboard de Monitoreo Transaccional</h1>
    </header>
    <main className={styles['app-layout__main']}>
      <Outlet />
    </main>
  </div>
)
