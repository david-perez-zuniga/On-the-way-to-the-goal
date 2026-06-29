import styles from './AddGoalCard.module.css'

export default function AddGoalCard() {
  return (
    <button className={styles.button}>
      <div className={styles.iconCircle}>
        <span className={`material-symbols-outlined ${styles.icon}`}>add</span>
      </div>
      <span className={styles.label}>Nueva Meta</span>
      <p className={styles.hint}>Empieza a planear tu próximo gran paso.</p>
    </button>
  )
}
