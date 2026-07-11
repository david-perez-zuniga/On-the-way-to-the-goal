import type { ReactNode } from 'react'
import Button from '../../../components/ui/Button'
import styles from './GoalCard.module.css'

interface GoalCardProps {
  icon: string
  iconBg: string
  iconColor: string
  title: string
  goalAmount: number
  currentAmount: number
  percentage: number
  actions?: ReactNode
  onDeposit?: () => void
  onModify?: () => void
  onDelete?: () => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function GoalCard({
  icon,
  iconBg,
  iconColor,
  title,
  goalAmount,
  currentAmount,
  percentage,
  actions,
  onDeposit,
  onModify,
  onDelete,
}: GoalCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.iconBox} style={{ background: iconBg }}>
        <span className={`material-symbols-outlined ${styles.icon}`} style={{ color: iconColor }}>
          {icon}
        </span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.goalAmount}>Meta: {formatCurrency(goalAmount)}</p>
      <div className={styles.spacer}>
        <div className={styles.stats}>
          <span className={styles.percentage}>{percentage}% completado</span>
          <span className={styles.currentAmount}>{formatCurrency(currentAmount)}</span>
        </div>
        <div className={styles.barOuter}>
          <div className={styles.barInner} style={{ width: `${percentage}%` }} />
        </div>
        {actions ?? (
          <div className={styles.actions}>
            <Button variant="gradientPrimary" onClick={onDeposit}>Invertir</Button>
            <Button variant="outline" onClick={onModify}>Modificar</Button>
            <button className={styles.deleteBtn} onClick={onDelete} title="Eliminar meta">
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
