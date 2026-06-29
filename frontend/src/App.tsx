import { Routes, Route } from 'react-router-dom'
import LandingPage from './features/landing/components/LandingPage'
import RegisterPage from './features/registration/components/RegisterPage'
import LoginPage from './features/login/components/LoginPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/iniciar-sesion" element={<LoginPage />} />
    </Routes>
  )
}

export default App
