function AppHeader({ theme, onToggleTheme }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="brand-pulse" aria-hidden="true" />
        <p className="brand-word">reviewer</p>
        <span className="brand-tag">Secure Arena</span>
      </div>

      <nav className="header-nav" aria-label="Main navigation">
        <a href="#library">Library</a>
        <a href="#tracks">Tracks</a>
        <a href="#workspace">Workbench</a>
      </nav>

      <div className="header-actions">
        <button type="button" className="button-ghost" onClick={onToggleTheme}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button type="button" className="button-primary button-compact">
          Launch Session
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
