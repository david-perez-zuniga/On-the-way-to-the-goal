import { Routes, Route } from 'react-router-dom'
import LandingPage from './features/landing/components/LandingPage'
import RegisterPage from './features/registration/components/RegisterPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/registro" element={<RegisterPage />} />
    </Routes>
  )
}

export default App
