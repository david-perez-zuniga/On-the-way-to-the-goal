import { useState } from 'react'
import DashboardHeader from './DashboardHeader'
import GoalCard from './GoalCard'
import AddGoalCard from './AddGoalCard'
import BottomNav from './BottomNav'
import FAB from './FAB'
import DepositModal from './DepositModal'
import ModifyGoalModal from './ModifyGoalModal'
import styles from './DashboardPage.module.css'

const goals = [
  {
    icon: 'home',
    iconBg: 'rgba(0, 103, 127, 0.1)',
    iconColor: 'var(--color-primary)',
    title: 'Casa de mis Sueños',
    goalAmount: 250000,
    currentAmount: 162500,
    percentage: 65,
  },
  {
    icon: 'directions_car',
    iconBg: 'rgba(0, 109, 53, 0.1)',
    iconColor: 'var(--color-secondary)',
    title: 'Auto Eléctrico',
    goalAmount: 65000,
    currentAmount: 26000,
    percentage: 40,
  },
  {
    icon: 'flight',
    iconBg: 'rgba(73, 75, 214, 0.1)',
    iconColor: 'var(--color-tertiary)',
    title: 'Viaje por Europa',
    goalAmount: 12000,
    currentAmount: 10200,
    percentage: 85,
  },
  {
    icon: 'laptop_mac',
    iconBg: 'rgba(0, 103, 127, 0.1)',
    iconColor: 'var(--color-primary)',
    title: 'Nuevo MacBook Pro',
    goalAmount: 3500,
    currentAmount: 700,
    percentage: 20,
  },
  {
    icon: 'shield',
    iconBg: 'rgba(186, 26, 26, 0.1)',
    iconColor: 'var(--color-error)',
    title: 'Fondo de Emergencia',
    goalAmount: 20000,
    currentAmount: 19000,
    percentage: 95,
  },
]

export default function DashboardPage() {
  const [deposit, setDeposit] = useState<{ open: boolean; goalTitle: string }>({
    open: false,
    goalTitle: '',
  })

  const [modify, setModify] = useState<{
    open: boolean
    goalTitle: string
    goalAmount: number
  }>({
    open: false,
    goalTitle: '',
    goalAmount: 0,
  })

  const handleDeposit = (title: string) => {
    setDeposit({ open: true, goalTitle: title })
  }

  const handleConfirm = (amount: number, currency: 'USD' | 'NIO') => {
    console.log(`Depósito: ${amount} ${currency} a "${deposit.goalTitle}"`)
    setDeposit({ open: false, goalTitle: '' })
  }

  const handleModify = (title: string, amount: number) => {
    setModify({ open: true, goalTitle: title, goalAmount: amount })
  }

  const handleSave = (title: string, amount: number, currency: 'USD' | 'NIO') => {
    console.log(`Meta modificada: "${title}", ${amount} ${currency}`)
    setModify({ open: false, goalTitle: '', goalAmount: 0 })
  }

  return (
    <>
      <DashboardHeader />
      <main className={styles.main}>
        <div className={styles.header}>
          <h2 className={styles.pageTitle}>Mis Metas de Ahorro</h2>
          <p className={styles.subtitle}>
            Transforma tus sueños en realidades financieras con un seguimiento inteligente.
          </p>
        </div>
        <div className={styles.grid}>
          {goals.map((goal) => (
            <GoalCard
              key={goal.title}
              icon={goal.icon}
              iconBg={goal.iconBg}
              iconColor={goal.iconColor}
              title={goal.title}
              goalAmount={goal.goalAmount}
              currentAmount={goal.currentAmount}
              percentage={goal.percentage}
              onDeposit={() => handleDeposit(goal.title)}
              onModify={() => handleModify(goal.title, goal.goalAmount)}
            />
          ))}
          <AddGoalCard />
        </div>
      </main>
      <BottomNav />
      <FAB />
      <DepositModal
        open={deposit.open}
        goalTitle={deposit.goalTitle}
        onClose={() => setDeposit({ open: false, goalTitle: '' })}
        onConfirm={handleConfirm}
      />
      <ModifyGoalModal
        open={modify.open}
        goalTitle={modify.goalTitle}
        goalAmount={modify.goalAmount}
        onClose={() => setModify({ open: false, goalTitle: '', goalAmount: 0 })}
        onSave={handleSave}
      />
    </>
  )
}
