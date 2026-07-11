import { useState } from 'react'
import FormField from '../../../components/ui/FormField'
import Button from '../../../components/ui/Button'
import styles from './CreateGoalModal.module.css'

interface CreateGoalModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (title: string, totalAmount: number, currency: 'USD' | 'NIO') => void
}

export default function CreateGoalModal({ open, onClose, onConfirm }: CreateGoalModalProps) {
  const [title, setTitle] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'NIO'>('USD')

  if (!open) return null

  const handleSubmit = () => {
    const amount = parseFloat(totalAmount)
    if (title.trim() && amount > 0) {
      onConfirm(title.trim(), amount, currency)
      setTitle('')
      setTotalAmount('')
      setCurrency('USD')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Crear Nueva Meta</h2>
          <p className={styles.subtitle}>Define tu próximo gran paso financiero.</p>
        </div>
        <div className={styles.body}>
          <FormField
            label="Título de la meta"
            icon="label"
            name="goal-title"
            type="text"
            placeholder="Ej. Casa en la playa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <FormField
            label="Monto de la meta"
            icon="payments"
            name="goal-amount"
            type="number"
            placeholder="0.00"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
          <div className={styles.field}>
            <span className={styles.label}>Tipo de moneda</span>
            <div className={styles.segmented}>
              <button
                className={`${styles.segmentedBtn} ${currency === 'USD' ? styles.segmentedActive : ''}`}
                onClick={() => setCurrency('USD')}
                type="button"
              >
                Dólares
              </button>
              <button
                className={`${styles.segmentedBtn} ${currency === 'NIO' ? styles.segmentedActive : ''}`}
                onClick={() => setCurrency('NIO')}
                type="button"
              >
                Córdobas
              </button>
            </div>
          </div>
          <div className={styles.actions}>
            <Button variant="gradientPrimary" onClick={handleSubmit}>
              Crear Meta
            </Button>
            <button className={styles.cancel} onClick={onClose} type="button">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
