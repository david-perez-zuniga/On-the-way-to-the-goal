import { useState } from 'react'
import Button from '../../../components/ui/Button'
import styles from './ModifyGoalModal.module.css'

interface ModifyGoalModalProps {
  open: boolean
  goalTitle: string
  goalAmount: number
  onClose: () => void
  onSave: (title: string, amount: number, currency: 'USD' | 'NIO') => void
}

export default function ModifyGoalModal({
  open,
  goalTitle,
  goalAmount,
  onClose,
  onSave,
}: ModifyGoalModalProps) {
  const [title, setTitle] = useState(goalTitle)
  const [amount, setAmount] = useState(String(goalAmount))
  const [currency, setCurrency] = useState<'USD' | 'NIO'>('USD')

  if (!open) return null

  const handleSave = () => {
    const parsed = parseFloat(amount)
    if (title.trim() && parsed > 0) {
      onSave(title.trim(), parsed, currency)
    }
  }

  const prefixSymbol = currency === 'USD' ? '$' : 'C$'

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Modificar Meta</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="modify-title">
              Título de la meta
            </label>
            <input
              id="modify-title"
              className={styles.input}
              type="text"
              placeholder="Ej: Mi primera casa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="modify-amount">
              Monto total de la meta
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.prefix}>{prefixSymbol}</span>
              <input
                id="modify-amount"
                className={styles.inputAmount}
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
            <Button variant="gradientPrimary" onClick={handleSave}>
              Guardar Cambios
            </Button>
            <button className={styles.cancel} onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
