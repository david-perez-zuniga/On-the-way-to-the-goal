import { useNavigate } from 'react-router-dom'
import heroImg from '../../../assets/imagendeladingpage.png'
import GlassCard from '../../../components/ui/GlassCard'
import ProgressCard from '../../../components/ui/ProgressCard'
import Button from '../../../components/ui/Button'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.textColumn}>
            <div className={styles.textContent}>
              <h1 className={styles.title}>
                On The Way To <br />
                <span className={styles.gradientText}>The Goal</span>
              </h1>
              <p className={styles.description}>
                Rastrea tus ahorros y alcanza tus metas más rápido con nuestro seguimiento visual de progreso.
                Experimenta tu crecimiento financiero a través de impresionantes visualizaciones 3D.
              </p>
            </div>
            <div className={styles.cta}>
              <Button variant="gradient" icon="arrow_forward" onClick={() => navigate('/registro')}>
                Logra tus metas ahora
              </Button>
            </div>
          </div>
          <div className={styles.imageColumn}>
            <div className={styles.blurCircle} />
            <GlassCard rotate className={styles.imageCard}>
              <img
                src={heroImg}
                alt="Ilustración 3D de seguimiento de metas"
                className={styles.heroImage}
              />
              <div className={styles.progressOverlay}>
                <ProgressCard
                  label="Fondo de Vacaciones"
                  percentage={78}
                  current={7800}
                  total={10000}
                />
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  )
}
