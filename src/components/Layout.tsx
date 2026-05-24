import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useUnreadMessageCount } from '../hooks/useUnreadMessageCount'
import { isAdminUser } from '../lib/admin'
import logoMark from '../assets/troc-logo.png'
import { SeoHead } from './SeoHead'

function BellIcon() {
  return (
    <svg
      className="nav-bell-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

const nav: ReadonlyArray<{ to: string; label: string; end?: boolean; tone?: string }> = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/troc', label: 'Troc alimentaire', tone: 'troc' },
  { to: '/competences', label: 'Savoir-faire', tone: 'skills' },
  { to: '/actualites', label: 'Actualités', tone: 'news' },
  { to: '/soutenir', label: 'Soutenir le réseau !', tone: 'support' },
]

export function Layout() {
  const { user, ready, logout } = useAuth()
  const unreadMessages = useUnreadMessageCount()

  return (
    <div className="app-shell">
      <SeoHead />
      <header className="site-header">
        <NavLink className="brand" to="/">
          <img src={logoMark} alt="" className="brand-logo" />
          <span>Troc &amp; Savoir-Faire</span>
        </NavLink>
        <nav className="site-nav" aria-label="Navigation principale">
          {nav.map(({ to, label, end, tone }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link${tone ? ` nav-link--${tone}` : ''}${isActive ? ' nav-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
          {ready && user ? (
            <NavLink
              to="/messages"
              className={({ isActive }) =>
                `nav-link nav-link--with-bell${isActive ? ' nav-link--active' : ''}`
              }
              aria-label={
                unreadMessages > 0
                  ? unreadMessages === 1
                    ? 'Messagerie, une conversation avec de nouveaux messages'
                    : `Messagerie, ${unreadMessages} conversations avec de nouveaux messages`
                  : 'Messagerie'
              }
            >
              <span className="nav-messages-link">
                <span className="nav-bell-wrap">
                  <BellIcon />
                  {unreadMessages > 0 ? (
                    <span className="nav-bell-badge" title={`${unreadMessages} nouveau(x) message(s)`}>
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  ) : null}
                </span>
                Messagerie
              </span>
            </NavLink>
          ) : null}
          {ready && isAdminUser(user) ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link--active' : ''}`
              }
            >
              Admin
            </NavLink>
          ) : null}
        </nav>
        <div className="site-actions">
          {!ready ? (
            <span className="small muted">…</span>
          ) : user ? (
            <>
              <span className="small muted nowrap">{user.display_name}</span>
              <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink className="nav-link" to="/connexion">
                Connexion
              </NavLink>
              <NavLink className="nav-link" to="/inscription">
                Inscription
              </NavLink>
            </>
          )}
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p className="small muted">
          Outil d’entraide locale - pas un commerce. Les échanges se font entre
          particuliers, sous leur responsabilité.{' '}
          <NavLink to="/informations">Infos &amp; cadre</NavLink> ·{' '}
          <NavLink to="/soutenir">Soutenir le réseau</NavLink> ·{' '}
          <a
            href="https://devenirautonome.fr/"
            target="_blank"
            rel="noreferrer"
          >
            Devenir autonome
          </a>
          {' · '}
          <a
            href="https://www.facebook.com/groups/reseauautonomie"
            target="_blank"
            rel="noopener noreferrer"
          >
            Groupe Facebook
          </a>
        </p>
      </footer>
    </div>
  )
}
