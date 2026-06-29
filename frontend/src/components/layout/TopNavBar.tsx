import type { ReactNode } from 'react'
import logoSrc from '../../assets/logo.png'
import styles from './TopNavBar.module.css'

interface TopNavBarProps {
  children?: ReactNode
}

export default function TopNavBar({ children }: TopNavBarProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logoSection}>
          <img src={logoSrc} alt="Logo de On The Way To The Goal" className={styles.logo} />
          <span className={styles.brandName}>On The Way To The Goal</span>
        </div>
        {children && <div className={styles.actions}>{children}</div>}
      </div>
    </header>
  )
}
