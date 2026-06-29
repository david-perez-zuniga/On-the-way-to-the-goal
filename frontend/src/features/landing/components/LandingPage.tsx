import { useNavigate } from 'react-router-dom'
import TopNavBar from '../../../components/layout/TopNavBar'
import Button from '../../../components/ui/Button'
import HeroSection from './HeroSection'
import styles from './LandingPage.module.css'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <>
      <TopNavBar>
        <Button variant="ghost" onClick={() => navigate('/iniciar-sesion')}>Iniciar sesión</Button>
        <Button variant="primary" onClick={() => navigate('/registro')}>Registrarse</Button>
      </TopNavBar>
      <main className={styles.main}>
        <HeroSection />
        <section className={styles.features}>
          <div className={styles.featuresInner}>
          </div>
        </section>
      </main>
    </>
  )
}
