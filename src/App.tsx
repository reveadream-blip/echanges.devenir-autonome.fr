import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { RequireAdmin } from './components/RequireAdmin'
import { CartePage } from './pages/CartePage'
import { CompetencesPage } from './pages/CompetencesPage'
import { HomePage } from './pages/HomePage'
import { InformationsPage } from './pages/InformationsPage'
import { ConfirmEmailPage } from './pages/ConfirmEmailPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ModifierCompetencePage } from './pages/ModifierCompetencePage'
import { ModifierTrocPage } from './pages/ModifierTrocPage'
import { NouvelleCompetencePage } from './pages/NouvelleCompetencePage'
import { NouveauTrocPage } from './pages/NouveauTrocPage'
import { RegisterPage } from './pages/RegisterPage'
import { CompetenceDetailPage } from './pages/CompetenceDetailPage'
import { MessagesInboxPage } from './pages/MessagesInboxPage'
import { MessagesThreadPage } from './pages/MessagesThreadPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { TrocDetailPage } from './pages/TrocDetailPage'
import { ActualitesPage } from './pages/ActualitesPage'
import { SoutenirPage } from './pages/SoutenirPage'
import { TrocPage } from './pages/TrocPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="troc" element={<TrocPage />} />
            <Route path="competences" element={<CompetencesPage />} />
            <Route path="carte" element={<CartePage />} />
            <Route path="informations" element={<InformationsPage />} />
            <Route path="actualites" element={<ActualitesPage />} />
            <Route path="soutenir" element={<SoutenirPage />} />
            <Route path="connexion" element={<LoginPage />} />
            <Route path="inscription" element={<RegisterPage />} />
            <Route path="confirmer-email" element={<ConfirmEmailPage />} />
            <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />
            <Route path="reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
            <Route
              path="troc/nouveau"
              element={
                <RequireAuth>
                  <NouveauTrocPage />
                </RequireAuth>
              }
            />
            <Route
              path="troc/:id/modifier"
              element={
                <RequireAuth>
                  <ModifierTrocPage />
                </RequireAuth>
              }
            />
            <Route path="troc/:id" element={<TrocDetailPage />} />
            <Route
              path="competences/nouveau"
              element={
                <RequireAuth>
                  <NouvelleCompetencePage />
                </RequireAuth>
              }
            />
            <Route
              path="competences/:id/modifier"
              element={
                <RequireAuth>
                  <ModifierCompetencePage />
                </RequireAuth>
              }
            />
            <Route path="competences/:id" element={<CompetenceDetailPage />} />
            <Route
              path="messages"
              element={
                <RequireAuth>
                  <MessagesInboxPage />
                </RequireAuth>
              }
            />
            <Route
              path="messages/:threadId"
              element={
                <RequireAuth>
                  <MessagesThreadPage />
                </RequireAuth>
              }
            />
            <Route
              path="admin"
              element={
                <RequireAdmin>
                  <AdminDashboardPage />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
