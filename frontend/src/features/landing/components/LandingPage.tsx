import TopNavBar from '../../../components/layout/TopNavBar'
import HeroSection from './HeroSection'
import styles from './LandingPage.module.css'

export default function LandingPage() {
  return (
    <>
      <TopNavBar />
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
