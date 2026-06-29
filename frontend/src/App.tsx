import { Routes, Route } from 'react-router-dom'
import LandingPage from './features/landing/components/LandingPage'
import RegisterPage from './features/registration/components/RegisterPage'
import LoginPage from './features/login/components/LoginPage'
import DashboardPage from './features/dashboard/components/DashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/iniciar-sesion" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  )
}

export default App
