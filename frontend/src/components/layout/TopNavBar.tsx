import type { ReactNode } from 'react'
import logoSrc from '../../assets/logo.png'
import styles from './TopNavBar.module.css'

interface TopNavBarProps {
  children?: ReactNode
  variant?: 'default' | 'simple'
}

export default function TopNavBar({ children, variant = 'default' }: TopNavBarProps) {
  const headerClass = variant === 'simple' ? `${styles.header} ${styles.simple}` : styles.header
  const brandClass = variant === 'simple' ? `${styles.brandName} ${styles.brandNameSimple}` : styles.brandName

  return (
    <header className={headerClass}>
      <div className={`${styles.inner} ${variant === 'simple' ? styles.innerSimple : ''}`}>
        <div className={styles.logoSection}>
          <img src={logoSrc} alt="Logo de On The Way To The Goal" className={styles.logo} />
          <span className={brandClass}>On The Way To The Goal</span>
        </div>
        {children && <div className={styles.actions}>{children}</div>}
      </div>
    </header>
  )
}
