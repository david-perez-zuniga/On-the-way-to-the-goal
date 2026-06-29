import type { InputHTMLAttributes } from 'react'
import styles from './FormField.module.css'

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  icon: string
}

export default function FormField({ label, icon, id, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? inputProps.name

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>{label}</label>
      <div className={styles.inputWrapper}>
        <span className={`material-symbols-outlined ${styles.icon}`}>{icon}</span>
        <input id={fieldId} className={styles.input} {...inputProps} />
      </div>
    </div>
  )
}
