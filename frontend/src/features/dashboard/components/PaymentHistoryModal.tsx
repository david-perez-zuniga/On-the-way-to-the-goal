import { useState, useEffect } from 'react'
import Button from '../../../components/ui/Button'
import { fetchPaymentHistory } from '../../goals/services/goalService'
import type { Payment } from '../../goals/types'
import styles from './PaymentHistoryModal.module.css'

interface PaymentHistoryModalProps {
  open: boolean
  goalId: string
  goalTitle: string
  onClose: () => void
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'NIO' ? 'NIO' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function PaymentHistoryModal({ open, goalId, goalTitle, onClose }: PaymentHistoryModalProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchPaymentHistory(goalId)
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [open, goalId])

  if (!open) return null

  const sorted = [...payments].sort(
    (a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime()
  )

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <h2 className={styles.title}>Historial de Abonos</h2>
            <p className={styles.goalName}>{goalTitle}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>Cargando historial...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={`material-symbols-outlined ${styles.emptyIcon}`}>history</span>
              <p className={styles.emptyText}>Aún no hay abonos registrados para esta meta.</p>
            </div>
          ) : (
            <div className={styles.timeline}>
              {sorted.map((payment) => (
                <div key={payment.id} className={styles.entry}>
                  <div className={styles.dot} />
                  <div className={styles.card}>
                    <div className={styles.left}>
                      <div className={styles.iconBox}>
                        <span className={`material-symbols-outlined ${styles.iconBoxIcon}`}>savings</span>
                      </div>
                      <div className={styles.info}>
                        <h3 className={styles.amount}>{formatCurrency(payment.deposit, payment.currency)}</h3>
                        <p className={styles.date}>{formatDate(payment.depositDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && sorted.length > 0 && (
          <div className={styles.footer}>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>
        )}
      </div>
    </div>
  )
}