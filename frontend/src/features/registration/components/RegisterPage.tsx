import { useNavigate } from 'react-router-dom'
import TopNavBar from '../../../components/layout/TopNavBar'
import Button from '../../../components/ui/Button'
import RegisterForm from './RegisterForm'
import styles from './RegisterPage.module.css'

export default function RegisterPage() {
  const navigate = useNavigate()

  return (
    <>
      <TopNavBar>
        <Button variant="primary" onClick={() => navigate('/iniciar-sesion')}>Iniciar sesión</Button>
      </TopNavBar>
      <main className={styles.main}>
        <RegisterForm />
      </main>
    </>
  )
}
