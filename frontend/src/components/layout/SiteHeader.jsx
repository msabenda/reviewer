import logo from "../../assets/logo.png";

function SiteHeader({
  path,
  onNavigate,
  theme,
  onToggleTheme,
  isAuthenticated,
  user,
  onLogout,
}) {
  const links = [
    { path: "/", label: "Home" },
    { path: "/demo", label: "Challenges" },
    ...(isAuthenticated ? [{ path: "/learn", label: "Learn" }] : []),
    ...(isAuthenticated ? [{ path: "/leaderboard", label: "Leaderboard" }] : []),
    ...(isAuthenticated ? [{ path: "/progress", label: "Progress" }] : []),
    ...(isAuthenticated && user?.role === "admin" ? [{ path: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="site-header">
      <button
        type="button"
        className="brand-button"
        onClick={() => onNavigate("/")}
        aria-label="Go to reviewer home"
      >
        <img src={logo} alt="Reviewer logo" className="brand-logo" />
        <span className="brand-text-wrap">
          <span className="brand-title">reviewer</span>
          <span className="brand-subtitle">Secure Review Trainer</span>
        </span>
      </button>

      <nav className="site-nav" aria-label="Primary">
        {links.map((link) => (
          <button
            key={link.path}
            type="button"
            className={`site-nav-link ${path === link.path ? "is-active" : ""}`}
            onClick={() => onNavigate(link.path)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="site-actions">
        <button
          type="button"
          className="theme-icon-button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        </button>

        {isAuthenticated ? (
          <>
            <button type="button" className="user-chip" onClick={() => onNavigate("/learn")}>
              {user?.full_name || "Developer"}
            </button>
            <button type="button" className="button-ghost" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button type="button" className="button-ghost" onClick={() => onNavigate("/login")}>
              Login
            </button>
            <button type="button" className="button-primary" onClick={() => onNavigate("/register")}>
              Register
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default SiteHeader;
