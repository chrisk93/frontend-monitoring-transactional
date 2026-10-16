import { Link } from 'react-router'
import styles from './NotFoundPage.module.scss'

export const NotFoundPage = () => (
  <section className={styles['not-found']}>
    <h2 className={styles['not-found__title']}>Página no encontrada</h2>
    <p>La dirección que buscas no existe.</p>
    <Link to="/" className={styles['not-found__link']}>
      Volver al dashboard
    </Link>
  </section>
)
