import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logoSrc from '../../../assets/logo.png'
import GlassCard from '../../../components/ui/GlassCard'
import FormField from '../../../components/ui/FormField'
import Button from '../../../components/ui/Button'
import { login } from '../../../services'
import styles from './LoginForm.module.css'

function GoogleIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24">
      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24">
      <path d="M12,2C6.477,2,2,6.477,2,12c0,5.085,3.811,9.28,8.719,9.91V14.22H8.16v-2.22h2.559v-1.691c0-2.524,1.543-3.905,3.791-3.905 c1.077,0,2.003,0.08,2.272,0.116v2.634l-1.559,0.001c-1.225,0-1.462,0.582-1.462,1.436v1.409h2.916l-0.381,2.22h-2.535V21.91 C18.189,21.28,22,17.085,22,12C22,6.477,17.523,2,12,2z" />
    </svg>
  )
}

export default function LoginForm() {
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
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <GlassCard className={styles.card}>
        <div className={styles.logoSection}>
          <img src={logoSrc} alt="Logo" className={styles.logo} />
        </div>
        <div className={styles.header}>
          <h1 className={styles.title}>Bienvenido de nuevo</h1>
          <p className={styles.subtitle}>Continúa tu viaje hacia tus metas</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <FormField
            variant="login"
            label="Correo electrónico"
            icon="mail"
            name="email"
            type="email"
            placeholder="ejemplo@correo.com"
            autoComplete="email"
          />
          <FormField
            variant="login"
            label="Contraseña"
            icon="lock"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <div className={styles.forgotRow}>
            <a className={styles.forgotLink} href="#">¿Olvidaste tu contraseña?</a>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.submitWrapper}>
            <Button variant="gradientLogin" type="submit" icon="arrow_forward" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </div>
        </form>
        <div className={styles.footer}>
          <p className={styles.footerText}>
            ¿No tienes una cuenta?
            <a className={styles.footerLink} href="#" onClick={(e) => { e.preventDefault(); navigate('/registro') }}>Regístrate</a>
          </p>
        </div>
      </GlassCard>
      <div className={styles.social}>
        <p className={styles.socialLabel}>O continúa con</p>
        <div className={styles.socialButtons}>
          <button className={styles.socialButton} aria-label="Iniciar sesión con Google">
            <GoogleIcon />
          </button>
          <button className={styles.socialButton} aria-label="Iniciar sesión con Facebook">
            <FacebookIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
