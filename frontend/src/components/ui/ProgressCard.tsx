import GlassCard from './GlassCard'
import styles from './ProgressCard.module.css'

interface ProgressCardProps {
  label: string
  percentage: number
  current: number
  total: number
  currency?: string
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ProgressCard({
  label,
  percentage,
  current,
  total,
  currency = 'USD',
}: ProgressCardProps) {
  return (
    <GlassCard className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.percentage}>{percentage}%</span>
      </div>
      <div className={styles.barOuter}>
        <div
          className={styles.barInner}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className={styles.amount}>
        {formatCurrency(current, currency)} / {formatCurrency(total, currency)}
      </p>
    </GlassCard>
  )
}
