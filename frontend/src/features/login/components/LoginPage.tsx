import { useNavigate } from 'react-router-dom'
import TopNavBar from '../../../components/layout/TopNavBar'
import Button from '../../../components/ui/Button'
import LoginForm from './LoginForm'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <>
      <TopNavBar variant="simple">
        <Button variant="primary" onClick={() => navigate('/registro')}>Registrarse</Button>
      </TopNavBar>
      <main className={styles.main}>
        <LoginForm />
      </main>
    </>
  )
}
