import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logoSrc from '../../../assets/logo.png'
import GlassCard from '../../../components/ui/GlassCard'
import FormField from '../../../components/ui/FormField'
import Button from '../../../components/ui/Button'
import { createUser } from '../../users/services/userService'
import styles from './RegisterForm.module.css'

export default function RegisterForm() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.target as HTMLFormElement
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    try {
      await createUser({ email, password })
      navigate('/iniciar-sesion')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
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
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.submitWrapper}>
            <Button variant="gradientPrimary" type="submit" icon="arrow_forward" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </div>
        </form>
        <div className={styles.footer}>
          <p className={styles.footerText}>
            ¿Ya tienes una cuenta?
            <a className={styles.footerLink} href="#" onClick={(e) => { e.preventDefault(); navigate('/iniciar-sesion') }}>Inicia sesión</a>
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
