import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logoSrc from '../../../assets/logo.png'
import GlassCard from '../../../components/ui/GlassCard'
import FormField from '../../../components/ui/FormField'
import Button from '../../../components/ui/Button'
import styles from './RegisterForm.module.css'

export default function RegisterForm() {
  const navigate = useNavigate()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
  }

  return (
    <div className={styles.wrapper}>
      <GlassCard className={styles.card}>
        <div className={styles.header}>
          <img src={logoSrc} alt="Brand Logo" className={styles.logo} />
          <h1 className={styles.title}>Comienza tu viaje</h1>
          <p className={styles.subtitle}>Transforma tus metas financieras hoy mismo.</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <FormField
            label="Correo electrónico"
            icon="mail"
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            autoComplete="email"
          />
          <FormField
            label="Contraseña"
            icon="lock"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
          <div className={styles.submitWrapper}>
            <Button variant="gradientPrimary" type="submit" icon="arrow_forward">
              Registrarse
            </Button>
          </div>
        </form>
        <div className={styles.footer}>
          <p className={styles.footerText}>
            ¿Ya tienes una cuenta?
            <a className={styles.footerLink} href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>Inicia sesión</a>
          </p>
        </div>
      </GlassCard>
      <div className={styles.security}>
        <p className={styles.securityText}>
          <span className={`material-symbols-outlined ${styles.securityIcon}`}>security</span>
          Tus datos están protegidos con cifrado de nivel bancario.
        </p>
      </div>
    </div>
  )
}
