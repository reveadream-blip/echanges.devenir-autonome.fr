import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CartePage } from './pages/CartePage'
import { CompetencesPage } from './pages/CompetencesPage'
import { HomePage } from './pages/HomePage'
import { InformationsPage } from './pages/InformationsPage'
import { TrocPage } from './pages/TrocPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="troc" element={<TrocPage />} />
          <Route path="competences" element={<CompetencesPage />} />
          <Route path="carte" element={<CartePage />} />
          <Route path="informations" element={<InformationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
