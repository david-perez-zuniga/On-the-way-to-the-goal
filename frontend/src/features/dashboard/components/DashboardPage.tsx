import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated, logout, getSimulationMode } from '../../../services'
import { fetchUserGoals, createGoal, createDeposit, updateGoal, deleteGoal } from '../../goals/services/goalService'
import type { GoalProgress } from '../../goals/types'
import DashboardHeader from './DashboardHeader'
import GoalCard from './GoalCard'
import AddGoalCard from './AddGoalCard'
import BottomNav from './BottomNav'
import FAB from './FAB'
import SimulationBanner from '../../../components/SimulationBanner'
import DepositModal from './DepositModal'
import ModifyGoalModal from './ModifyGoalModal'
import CreateGoalModal from './CreateGoalModal'
import PaymentHistoryModal from './PaymentHistoryModal'
import { getGoalVisual } from '../utils'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState<GoalProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [deposit, setDeposit] = useState<{ open: boolean; goalId: string; goalTitle: string }>({
    open: false,
    goalId: '',
    goalTitle: '',
  })
  const [depositing, setDepositing] = useState(false)

  const [modify, setModify] = useState<{
    open: boolean
    goalId: string
    goalTitle: string
    goalAmount: number
    goalCurrency: 'USD' | 'NIO'
    createdAt: string
    finishedAt: string | null
  }>({
    open: false,
    goalId: '',
    goalTitle: '',
    goalAmount: 0,
    goalCurrency: 'USD',
    createdAt: '',
    finishedAt: null,
  })
  const [modifying, setModifying] = useState(false)
  const [modifyError, setModifyError] = useState('')

  const [createOpen, setCreateOpen] = useState(false)

  const [history, setHistory] = useState<{ open: boolean; goalId: string; goalTitle: string }>({
    open: false,
    goalId: '',
    goalTitle: '',
  })

  const [deleteConfirm, setDeleteConfirm] = useState<{ goalId: string; goalTitle: string } | null>(null)

  const loadGoals = useCallback(() => {
    setLoading(true)
    setError('')
    fetchUserGoals()
      .then(setGoals)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar metas'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/iniciar-sesion', { replace: true })
      return
    }

    loadGoals()
  }, [navigate, loadGoals])

  const handleDeposit = (id: string, title: string) => {
    setDeposit({ open: true, goalId: id, goalTitle: title })
  }

  const handleConfirm = async (amount: number, currency: 'USD' | 'NIO') => {
    setDepositing(true)
    try {
      await createDeposit(deposit.goalId, amount, currency)
      setDeposit({ open: false, goalId: '', goalTitle: '' })
      loadGoals()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al realizar el depósito')
    } finally {
      setDepositing(false)
    }
  }

  const handleModify = (id: string, title: string, amount: number, currency: 'USD' | 'NIO', createdAt: string, finishedAt: string | null) => {
    setModify({ open: true, goalId: id, goalTitle: title, goalAmount: amount, goalCurrency: currency, createdAt, finishedAt })
    setModifyError('')
  }

  const handleSave = async (title: string, amount: number) => {
    setModifying(true)
    setModifyError('')
    try {
      await updateGoal(modify.goalId, {
        title,
        totalAmount: amount,
        currency: modify.goalCurrency,
        createdAt: new Date(modify.createdAt).toISOString(),
        finishedAt: modify.finishedAt ? new Date(modify.finishedAt).toISOString() : null,
      })
      setModify({ open: false, goalId: '', goalTitle: '', goalAmount: 0, goalCurrency: 'USD', createdAt: '', finishedAt: null })
      loadGoals()
    } catch (err) {
      setModifyError(err instanceof Error ? err.message : 'Error al modificar la meta')
    } finally {
      setModifying(false)
    }
  }

  const handleHistory = (id: string, title: string) => {
    setHistory({ open: true, goalId: id, goalTitle: title })
  }

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteConfirm({ goalId: id, goalTitle: title })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    try {
      await deleteGoal(deleteConfirm.goalId)
      setDeleteConfirm(null)
      loadGoals()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la meta')
    }
  }

  const handleCreateGoal = async (title: string, totalAmount: number, currency: 'USD' | 'NIO') => {
    try {
      await createGoal({ title, totalAmount, currency })
      setCreateOpen(false)
      loadGoals()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear meta')
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      <DashboardHeader onLogout={handleLogout} />
      {getSimulationMode() && <SimulationBanner />}
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
            <button className={styles.createBtn} onClick={() => setCreateOpen(true)}>
              Crear meta
            </button>
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
                    onDeposit={() => handleDeposit(goal.id, goal.title)}
                    onModify={() => handleModify(goal.id, goal.title, goal.totalAmount, goal.currency as 'USD' | 'NIO', goal.createdAt, goal.finishedAt)}
                    onDelete={() => handleDeleteClick(goal.id, goal.title)}
                    onHistory={() => handleHistory(goal.id, goal.title)}
                />
              )
            })}
            <AddGoalCard onClick={() => setCreateOpen(true)} />
          </div>
        )}
      </main>
      <BottomNav />
      <FAB />
      <DepositModal
        open={deposit.open}
        goalTitle={deposit.goalTitle}
        loading={depositing}
        onClose={() => setDeposit({ open: false, goalId: '', goalTitle: '' })}
        onConfirm={handleConfirm}
      />
      {modify.open && (
        <ModifyGoalModal
          open={modify.open}
          goalTitle={modify.goalTitle}
          goalAmount={modify.goalAmount}
          goalCurrency={modify.goalCurrency}
          loading={modifying}
          error={modifyError}
          onClose={() => {
            setModify({ open: false, goalId: '', goalTitle: '', goalAmount: 0, goalCurrency: 'USD', createdAt: '', finishedAt: null })
            setModifyError('')
          }}
          onSave={handleSave}
        />
      )}
      <CreateGoalModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onConfirm={handleCreateGoal}
      />
      <PaymentHistoryModal
        open={history.open}
        goalId={history.goalId}
        goalTitle={history.goalTitle}
        onClose={() => setHistory({ open: false, goalId: '', goalTitle: '' })}
      />
      {deleteConfirm && (
        <div className={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalText}>
              ¿Estás seguro de eliminar la meta "{deleteConfirm.goalTitle}"?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.confirmBtn} onClick={handleDeleteConfirm}>
                Sí, eliminar
              </button>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
