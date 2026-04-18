import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/reviewerApi";

function AuthPage({ mode, onNavigate, onSuccess, intentMessage = "" }) {
  const isRegister = mode === "register";
  const { register, login, error: authError, setAuthError } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const headline = useMemo(() => {
    if (isRegister) {
      return "Create your reviewer account";
    }
    return "Login to continue learning";
  }, [isRegister]);

  useEffect(() => {
    setLocalError("");
    setSuccessMessage("");
    setAuthError("");
  }, [mode, setAuthError]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");
    setAuthError("");

    if (isRegister && password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    if (isRegister && password.length < 10) {
      setLocalError("Password must be at least 10 characters.");
      return;
    }

    if (
      isRegister &&
      (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password))
    ) {
      setLocalError("Password must include uppercase, lowercase, and a number.");
      return;
    }

    setSubmitting(true);

    try {
      if (isRegister) {
        const session = await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        });
        try {
          await logoutUser(session.csrf_token);
        } catch {
          // If logout fails, still proceed to login prompt; cookie will expire or be overwritten.
        }

        setSuccessMessage("Account created successfully. Redirecting to login...");
        window.setTimeout(() => onNavigate("/login", { replace: true }), 900);
        return;
      } else {
        await login({
          email: email.trim(),
          password,
        });
      }

      onSuccess();
    } catch (submitError) {
      setLocalError(submitError.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-shell">
        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-visual-inner">
            <p className="section-label">Secure code review training</p>
            <h2>Build reviewer instincts that ship safer software.</h2>
            <p className="auth-visual-subtitle">
              Practice real-world checks, get immediate feedback, and track progress across stacks.
            </p>
            <div className="auth-visual-stats">
              <article>
                <p>Tracks</p>
                <strong>API · Web · AI · MCP</strong>
              </article>
              <article>
                <p>Mode</p>
                <strong>VSCode-style workspace</strong>
              </article>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <p className="section-label">Secure Access</p>
          <h1>{headline}</h1>
          <p>
            {isRegister
              ? "Create an account to unlock full challenge tracks, progress history, and personalized learning stats."
              : "Sign in to continue your secure code review learning path."}
          </p>

          {intentMessage ? <p className="auth-intent">{intentMessage}</p> : null}
          {successMessage ? <p className="auth-success">{successMessage}</p> : null}
          {localError ? <p className="auth-error">{localError}</p> : null}
          {authError ? <p className="auth-error">{authError}</p> : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister ? (
              <label className="field-label">
                Full Name
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  minLength={2}
                  maxLength={160}
                  required
                  placeholder="Jane Developer"
                  autoComplete="name"
                />
              </label>
            ) : null}

            <label className="field-label">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                autoComplete={isRegister ? "email" : "username"}
              />
            </label>

            <label className="field-label">
              Password
              <div className="input-with-button">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={isRegister ? 10 : 1}
                  placeholder="••••••••••"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="input-inline-button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {isRegister ? (
              <label className="field-label">
                Confirm Password
                <div className="input-with-button">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={10}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-inline-button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            ) : null}

            {isRegister ? (
              <div className="auth-helper">
                <strong>Password rules</strong>
                <p>At least 10 characters, with uppercase, lowercase, and a number.</p>
              </div>
            ) : null}

            <button type="submit" className="button-primary auth-submit" disabled={submitting}>
              {submitting
                ? isRegister
                  ? "Creating account..."
                  : "Signing in..."
                : isRegister
                  ? "Create Account"
                  : "Login"}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "Need an account?"}
            <button
              type="button"
              className="text-button"
              onClick={() => onNavigate(isRegister ? "/login" : "/register")}
            >
              {isRegister ? "Login" : "Register"}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}

export default AuthPage;
