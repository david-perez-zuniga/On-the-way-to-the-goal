import type { InputHTMLAttributes } from 'react'
import styles from './FormField.module.css'

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  icon: string
  variant?: 'default' | 'login'
}

export default function FormField({ label, icon, id, variant = 'default', ...inputProps }: FormFieldProps) {
  const fieldId = id ?? inputProps.name
  const isLogin = variant === 'login'

  const fieldClass = isLogin ? `${styles.field} ${styles.fieldLogin}` : styles.field
  const wrapperClass = isLogin ? `${styles.inputWrapper} ${styles.inputWrapperLogin}` : styles.inputWrapper
  const iconClass = isLogin ? `${styles.icon} ${styles.iconLogin}` : styles.icon
  const inputClass = isLogin ? `${styles.input} ${styles.inputLogin}` : styles.input
  const labelClass = isLogin ? `${styles.label} ${styles.labelLogin}` : styles.label

  return (
    <div className={fieldClass}>
      <label className={labelClass} htmlFor={fieldId}>{label}</label>
      <div className={wrapperClass}>
        <span className={`material-symbols-outlined ${iconClass}`}>{icon}</span>
        <input id={fieldId} className={inputClass} {...inputProps} />
      </div>
    </div>
  )
}
