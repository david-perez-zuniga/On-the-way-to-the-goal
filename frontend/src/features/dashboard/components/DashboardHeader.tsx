import { useState } from 'react'
import logoSrc from '../../../assets/logo.png'
import styles from './DashboardHeader.module.css'

interface DashboardHeaderProps {
  onLogout: () => void
}

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.modalText}>¿Quieres cerrar la sesión?</p>
        <div className={styles.modalActions}>
          <button className={styles.confirmBtn} onClick={onConfirm}>Sí</button>
          <button className={styles.cancelBtn} onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardHeader({ onLogout }: DashboardHeaderProps) {
  const [showLogout, setShowLogout] = useState(false)

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <div className={styles.logoSection}>
            <img src={logoSrc} alt="Logo" className={styles.logo} />
            <h1 className={styles.title}>On The Way To The Goal</h1>
          </div>
          <button
            className={`material-symbols-outlined ${styles.accountBtn}`}
            aria-label="Cuenta"
            onClick={() => setShowLogout(true)}
          >
            account_circle
          </button>
        </div>
      </header>
      {showLogout && (
        <LogoutModal
          onConfirm={() => {
            setShowLogout(false)
            onLogout()
          }}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  )
}
