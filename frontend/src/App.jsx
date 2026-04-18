import { useEffect } from "react";

import SiteHeader from "./components/layout/SiteHeader";
import { useAuth } from "./context/AuthContext";
import { usePathRouter } from "./hooks/usePathRouter";
import { useThemeMode } from "./hooks/useThemeMode";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import DemoChallengePage from "./pages/DemoChallengePage";
import DemoPage from "./pages/DemoPage";
import LandingPage from "./pages/LandingPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LearningPage from "./pages/LearningPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProgressPage from "./pages/ProgressPage";

function App() {
  const { theme, toggleTheme } = useThemeMode();
  const { path, navigate } = usePathRouter();
  const { user, csrfToken, isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated && (path === "/login" || path === "/register")) {
      navigate("/learn", { replace: true });
    }
  }, [isAuthenticated, path, navigate]);

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  function renderRoute() {
    if (loading) {
      return (
        <section className="loading-page loading-page-dev">
          <p className="section-label">Session</p>
          <h1>Loading workspace</h1>
          <p className="loading-page-detail">Verifying credentials and CSRF token…</p>
        </section>
      );
    }

    if (path === "/") {
      return <LandingPage onNavigate={navigate} isAuthenticated={isAuthenticated} />;
    }

    if (path === "/demo") {
      return <DemoPage onNavigate={navigate} />;
    }

    if (path === "/demo/challenge") {
      return <DemoChallengePage onNavigate={navigate} />;
    }

    if (path === "/register") {
      return (
        <AuthPage
          mode="register"
          onNavigate={navigate}
          onSuccess={() => navigate("/login", { replace: true })}
        />
      );
    }

    if (path === "/login") {
      return (
        <AuthPage
          mode="login"
          onNavigate={navigate}
          onSuccess={() => navigate("/learn", { replace: true })}
        />
      );
    }

    if (path === "/learn") {
      if (!isAuthenticated) {
        return (
          <AuthPage
            mode="login"
            onNavigate={navigate}
            intentMessage="Login is required before you can access full learning challenges."
            onSuccess={() => navigate("/learn", { replace: true })}
          />
        );
      }

      return <LearningPage csrfToken={csrfToken} user={user} />;
    }

    if (path === "/progress") {
      if (!isAuthenticated) {
        return (
          <AuthPage
            mode="login"
            onNavigate={navigate}
            intentMessage="Login is required to view your learning progress."
            onSuccess={() => navigate("/progress", { replace: true })}
          />
        );
      }
      return <ProgressPage csrfToken={csrfToken} onNavigate={navigate} />;
    }

    if (path === "/leaderboard") {
      if (!isAuthenticated) {
        return (
          <AuthPage
            mode="login"
            onNavigate={navigate}
            intentMessage="Login is required to view the training leaderboard."
            onSuccess={() => navigate("/leaderboard", { replace: true })}
          />
        );
      }
      return <LeaderboardPage csrfToken={csrfToken} />;
    }

    if (path === "/admin") {
      if (!isAuthenticated) {
        return (
          <AuthPage
            mode="login"
            onNavigate={navigate}
            intentMessage="Admin login is required to upload challenge packs."
            onSuccess={() => navigate("/admin", { replace: true })}
          />
        );
      }
      if (user?.role !== "admin") {
        return (
          <section className="not-found-page">
            <p className="section-label">Access denied</p>
            <h1>Admin access required</h1>
            <p>Your account does not have permission to manage challenge uploads.</p>
          </section>
        );
      }
      return <AdminPage csrfToken={csrfToken} />;
    }

    return <NotFoundPage onNavigate={navigate} />;
  }

  return (
    <div className="site-shell">
      <div className="site-backdrop" aria-hidden="true" />
      <SiteHeader
        path={path}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
      <main className="site-main">{renderRoute()}</main>
    </div>
  );
}

export default App;
