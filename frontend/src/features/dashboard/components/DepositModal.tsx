import { useState } from 'react'
import Button from '../../../components/ui/Button'
import styles from './DepositModal.module.css'

interface DepositModalProps {
  open: boolean
  goalTitle: string
  loading?: boolean
  onClose: () => void
  onConfirm: (amount: number, currency: 'USD' | 'NIO') => void
}

export default function DepositModal({ open, goalTitle, loading, onClose, onConfirm }: DepositModalProps) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'NIO'>('USD')

  if (!open) return null

  const handleConfirm = () => {
    const parsed = parseFloat(amount)
    if (parsed > 0 && !loading) {
      onConfirm(parsed, currency)
      setAmount('')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Invertir en tu meta</h2>
            <p className={styles.goalName}>{goalTitle}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Monto a invertir</label>
            <div className={styles.inputWrapper}>
              <span className={styles.prefix}>$</span>
              <input
                className={styles.input}
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Moneda</label>
            <div className={styles.toggle}>
              <button
                className={`${styles.toggleBtn} ${currency === 'USD' ? styles.active : ''}`}
                onClick={() => setCurrency('USD')}
              >
                Dólares
              </button>
              <button
                className={`${styles.toggleBtn} ${currency === 'NIO' ? styles.active : ''}`}
                onClick={() => setCurrency('NIO')}
              >
                Córdobas
              </button>
            </div>
          </div>
          <div className={styles.actions}>
            <Button variant="gradientPrimary" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar Inversión'}
            </Button>
            <button className={styles.cancel} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
