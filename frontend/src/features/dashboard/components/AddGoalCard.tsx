import styles from './AddGoalCard.module.css'

interface AddGoalCardProps {
  onClick?: () => void
}

export default function AddGoalCard({ onClick }: AddGoalCardProps) {
  return (
    <button className={styles.button} onClick={onClick}>
      <div className={styles.iconCircle}>
        <span className={`material-symbols-outlined ${styles.icon}`}>add</span>
      </div>
      <span className={styles.label}>Nueva Meta</span>
      <p className={styles.hint}>Empieza a planear tu próximo gran paso.</p>
    </button>
  )
}
