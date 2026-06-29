import type { ReactNode } from 'react'
import styles from './GlassCard.module.css'

interface GlassCardProps {
  children: ReactNode
  className?: string
  rotate?: boolean
}

export default function GlassCard({ children, className = '', rotate = false }: GlassCardProps) {
  const classNames = [
    styles.card,
    rotate ? styles.rotated : '',
    className,
  ].filter(Boolean).join(' ')

  return <div className={classNames}>{children}</div>
}
