import logoSrc from '../../assets/logo.png'
import Button from '../ui/Button'
import styles from './TopNavBar.module.css'

interface TopNavBarProps {
  onLogin?: () => void
  onRegister?: () => void
}

export default function TopNavBar({ onLogin, onRegister }: TopNavBarProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logoSection}>
          <img src={logoSrc} alt="Logo de On The Way To The Goal" className={styles.logo} />
          <span className={styles.brandName}>On The Way To The Goal</span>
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onLogin}>
            Iniciar sesión
          </Button>
          <Button variant="primary" onClick={onRegister}>
            Registrarse
          </Button>
        </div>
      </div>
    </header>
  )
}
