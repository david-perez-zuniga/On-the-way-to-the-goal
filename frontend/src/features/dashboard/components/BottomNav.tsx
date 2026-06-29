import styles from './BottomNav.module.css'

interface NavItem {
  icon: string
  label: string
  href: string
  fill?: boolean
}

const items: NavItem[] = [
  { icon: 'track_changes', label: 'Goals', href: '#', fill: true },
  { icon: 'leaderboard', label: 'Analytics', href: '#' },
  { icon: 'savings', label: 'Savings', href: '#' },
  { icon: 'person', label: 'Profile', href: '#' },
]

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {items.map((item, index) => (
        <a
          key={item.label}
          href={item.href}
          className={`${styles.link} ${index === 0 ? styles.active : ''}`}
        >
          <span className={`material-symbols-outlined ${styles.icon} ${item.fill ? styles.iconFill : ''}`}>
            {item.icon}
          </span>
          <span className={styles.label}>{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
