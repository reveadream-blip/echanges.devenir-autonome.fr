import { NavLink, Outlet } from 'react-router-dom'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return 'nav-link' + (isActive ? ' nav-link--active' : '')
}

export function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/" className="brand">
          Troc et Survie
        </NavLink>
        <nav className="site-nav" aria-label="Navigation principale">
          <NavLink to="/troc" className={navLinkClass}>
            Troc alimentaire
          </NavLink>
          <NavLink to="/competences" className={navLinkClass}>
            Compétences
          </NavLink>
          <NavLink to="/carte" className={navLinkClass}>
            Proximité
          </NavLink>
          <NavLink to="/informations" className={navLinkClass}>
            Infos légales
          </NavLink>
        </nav>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p className="muted small">
          MVP technique · hébergement prévu sur{' '}
          <span className="nowrap">echanges.devenir-autonome.fr</span> · pas de
          données personnelles collectées à ce stade.
        </p>
      </footer>
    </div>
  )
}
