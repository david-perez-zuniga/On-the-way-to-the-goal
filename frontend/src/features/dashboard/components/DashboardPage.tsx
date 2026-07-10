import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated, logout } from '../../../services'
import { fetchUserGoals } from '../../goals/services/goalService'
import type { GoalProgress } from '../../goals/types'
import DashboardHeader from './DashboardHeader'
import GoalCard from './GoalCard'
import AddGoalCard from './AddGoalCard'
import BottomNav from './BottomNav'
import FAB from './FAB'
import DepositModal from './DepositModal'
import ModifyGoalModal from './ModifyGoalModal'
import { getGoalVisual } from '../utils'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState<GoalProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/iniciar-sesion', { replace: true })
      return
    }

    fetchUserGoals()
      .then(setGoals)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar metas'))
      .finally(() => setLoading(false))
  }, [navigate])

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

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      <DashboardHeader onLogout={handleLogout} />
      <main className={styles.main}>
        <div className={styles.header}>
          <h2 className={styles.pageTitle}>Mis Metas de Ahorro</h2>
          <p className={styles.subtitle}>
            Transforma tus sueños en realidades financieras con un seguimiento inteligente.
          </p>
        </div>
        {loading ? (
          <p className={styles.emptyText}>Cargando tus metas...</p>
        ) : error ? (
          <p className={styles.emptyText}>{error}</p>
        ) : goals.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={`material-symbols-outlined ${styles.emptyIcon}`}>savings</span>
            <p className={styles.emptyText}>Aún no tienes una meta, crea una para verla</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {goals.map((goal) => {
              const visual = getGoalVisual(goal.title)
              return (
                <GoalCard
                  key={goal.id}
                  icon={visual.icon}
                  iconBg={visual.iconBg}
                  iconColor={visual.iconColor}
                  title={goal.title}
                  goalAmount={goal.totalAmount}
                  currentAmount={goal.currentAmount}
                  percentage={goal.percentage}
                  onDeposit={() => handleDeposit(goal.title)}
                  onModify={() => handleModify(goal.title, goal.totalAmount)}
                />
              )
            })}
            <AddGoalCard />
          </div>
        )}
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
