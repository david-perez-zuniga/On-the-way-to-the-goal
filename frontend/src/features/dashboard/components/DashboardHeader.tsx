import logoSrc from '../../../assets/logo.png'
import styles from './DashboardHeader.module.css'

export default function DashboardHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logoSection}>
          <img src={logoSrc} alt="Logo" className={styles.logo} />
          <h1 className={styles.title}>On The Way To The Goal</h1>
        </div>
        <button className={`material-symbols-outlined ${styles.accountBtn}`} aria-label="Cuenta">
          account_circle
        </button>
      </div>
    </header>
  )
}
