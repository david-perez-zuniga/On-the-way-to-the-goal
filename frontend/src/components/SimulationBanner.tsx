import styles from './SimulationBanner.module.css'

export default function SimulationBanner() {
  return (
    <div className={styles.banner}>
      <span className={`material-symbols-outlined ${styles.icon}`}>cloud_off</span>
      <p className={styles.text}>
        <strong>Modo simulación</strong> — No se pudo conectar con el servidor. Los datos
        no se guardarán al recargar la página.
      </p>
    </div>
  )
}
