import styles from './FAB.module.css'

export default function FAB() {
  return (
    <button className={styles.fab} aria-label="Agregar meta">
      <span className={`material-symbols-outlined ${styles.icon}`}>add</span>
    </button>
  )
}
