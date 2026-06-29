import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'gradient' | 'gradientPrimary' | 'gradientLogin'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={classNames} {...props}>
      {children}
      {icon && <span className={`material-symbols-outlined ${styles.icon}`}>{icon}</span>}
    </button>
  )
}
