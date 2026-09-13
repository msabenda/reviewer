import { useEffect, useMemo, useState } from "react";
import landingCodeReview from "../assets/landing-code-review.png";
import landingFeedback from "../assets/landing-feedback.png";
import landingTeamPreview from "../assets/landing-team-preview.png";
import challengeImage from "../assets/challenge.png";
import logo from "../assets/logo.png";
import FeatureGrid from "../components/landing/FeatureGrid";
import LanguageCloud from "../components/landing/LanguageCloud";

const FEATURES = [
  {
    kicker: "OWASP Focus",
    title: "Top 10 Coverage",
    description:
      "Practice API, web, AI, and MCP review mistakes using challenge-driven secure review workflows.",
  },
  {
    kicker: "Gamified",
    title: "Score and Progress",
    description:
      "Improve precision, track streaks, and build your secure code reviewer rank over each session.",
  },
  {
    kicker: "Team Ready",
    title: "Developer Friendly",
    description:
      "Clean challenge layouts, filterable challenge packs, and modern workflows for real project teams.",
  },
];

const LANGUAGES = [
  "PHP",
  "Laravel",
  "Django",
  "Flask",
  "FastAPI",
  "Next.js",
  "React",
  "NodeJS",
  "Go",
  "Java",
  "Spring Boot",
  "AI",
  "MCP",
];

const LIVE_EVENTS = [
  { team: "Backend Guild", action: "Detected insecure token validation", impact: "+120 pts" },
  { team: "AppSec Squad", action: "Found SSRF in outbound webhook flow", impact: "+180 pts" },
  { team: "Frontend Core", action: "Patched DOM XSS sink in dashboard", impact: "+90 pts" },
];

const PORTFOLIO_FLOW = [
  {
    step: "01",
    title: "Pick a real-world challenge",
    detail: "Open a stack-specific review mission from API, web, cloud, AI, and MCP tracks.",
    image: challengeImage,
  },
  {
    step: "02",
    title: "Investigate code like production",
    detail: "Work through structured folders, read context, and submit exact vulnerable lines.",
    image: landingCodeReview,
  },
  {
    step: "03",
    title: "Learn from reviewer feedback",
    detail: "Get immediate score impact, hints, and secure-fix direction for each attempt.",
    image: landingFeedback,
  },
];

const TESTIMONIALS = [
  {
    author: "Senior Backend Engineer",
    role: "Fintech Platform",
    quote:
      "reviewer made code review training practical for our team. Engineers now catch auth and token flaws earlier.",
  },
  {
    author: "Application Security Analyst",
    role: "Product Security",
    quote:
      "The challenge flow mirrors real secure review sessions. It is engaging enough for weekly learning drills.",
  },
];

function LandingPage({ onNavigate, isAuthenticated }) {
  const [spotlight, setSpotlight] = useState({ x: 38, y: 25 });
  const [activePortfolioImage, setActivePortfolioImage] = useState(0);

  const portfolioImages = useMemo(
    () => [landingTeamPreview, landingCodeReview],
    []
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActivePortfolioImage((current) => (current + 1) % portfolioImages.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [portfolioImages.length]);

  const spotlightStyle = useMemo(
    () =>
      ({
        "--spot-x": `${spotlight.x}%`,
        "--spot-y": `${spotlight.y}%`,
      }),
    [spotlight]
  );

  function handleHeroPointerMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setSpotlight({ x: Math.min(92, Math.max(8, x)), y: Math.min(85, Math.max(12, y)) });
  }



  return (
    <div className="landing-page">
      <section className="landing-hero" style={spotlightStyle} onPointerMove={handleHeroPointerMove}>
        <div className="landing-hero-main">
          <p className="section-label">Developer + Security Reviewer Platform</p>
          <h1>Safer code. Better reviews.</h1>
          <p>
            reviewer turns code review into a practical lab for developers and security
            researchers. Learn to catch real vulnerabilities in API, web, cloud, AI, and MCP
            flows before they hit production.
          </p>

          <div className="landing-actions">
            <button type="button" className="button-primary" onClick={() => onNavigate("/demo")}>
              Play Demo Challenges
            </button>
            {isAuthenticated ? (
              <button type="button" className="button-ghost" onClick={() => onNavigate("/learn")}>
                Continue Learning
              </button>
            ) : (
              <button type="button" className="button-ghost" onClick={() => onNavigate("/register")}>
                Register to Start
              </button>
            )}
          </div>

          <div className="landing-metrics">
            <article>
              <p>Challenge Packs</p>
              <h3>50+</h3>
            </article>
            <article>
              <p>Security Patterns</p>
              <h3>120+</h3>
            </article>
            <article>
              <p>Team Readiness</p>
              <h3>Enterprise</h3>
            </article>
          </div>
        </div>

        <aside className="journey-card">
          <p className="section-label">Visual Workspace</p>
          <div className="landing-hero-visual">
            <img src={landingCodeReview} alt="Reviewer workspace code editor preview" />
          </div>
          <div className="landing-live-events">
            {LIVE_EVENTS.map((event) => (
              <article key={`${event.team}-${event.action}`} className="landing-live-event">
                <p>{event.team}</p>
                <h4>{event.action}</h4>
                <span>{event.impact}</span>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="landing-portfolio-section">
        <div className="landing-portfolio-visual">
          {portfolioImages.map((image, index) => (
            <img
              key={image}
              src={image}
              alt="Reviewer workspace preview"
              className={
                index === activePortfolioImage
                  ? "landing-portfolio-slide is-active"
                  : "landing-portfolio-slide"
              }
              loading={index === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
        <div className="landing-portfolio-layout">
          <div className="landing-section-header">
            <p className="section-label">Built for modern teams</p>
            <h2>One platform for developer growth and security depth</h2>
          </div>
          <div className="landing-portfolio-grid">
            <article className="portfolio-feature-card">
              <span>For developers</span>
              <h3>Practice review in a familiar code workspace</h3>
              <p>Open realistic folders, inspect code paths, and build better pull request habits.</p>
            </article>
            <article className="portfolio-feature-card">
              <span>For security teams</span>
              <h3>Turn secure review into repeatable training</h3>
              <p>Use guided challenges to sharpen detection across auth, validation, and logic flaws.</p>
            </article>
            <article className="portfolio-stat-card">
              <strong>Modern stacks</strong>
              <p>PHP, Laravel, Django, Flask, FastAPI, React, NodeJS, Go, Java, Spring Boot, AI, MCP</p>
            </article>
            <article className="portfolio-stat-card">
              <strong>Clear outcomes</strong>
              <p>Reviewer feedback, progress tracking, challenge scoring, and visual submission flow</p>
            </article>
          </div>
        </div>
      </section>


      <FeatureGrid items={FEATURES} />
      <LanguageCloud languages={LANGUAGES} />

      <section className="landing-process-section">
        <div className="landing-section-header">
          <p className="section-label">How it works</p>
          <h2>How it works</h2>
        </div>
        <div className="landing-process-grid">
          {PORTFOLIO_FLOW.map((item) => (
            <article key={item.step} className="process-card">
              <img src={item.image} alt={`${item.title} preview`} className="process-card-image" />
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-testimonial-section">
        <div className="landing-section-header">
          <p className="section-label">Team feedback</p>
          <h2>Trusted by developers and AppSec professionals</h2>
        </div>
        <div className="landing-testimonial-grid">
          {TESTIMONIALS.map((item) => (
            <article key={item.author} className="testimonial-card">
              <p>{item.quote}</p>
              <h4>{item.author}</h4>
              <span>{item.role}</span>
            </article>
          ))}
        </div>
      </section>

      <section
        className="landing-cta-band"
        style={{ "--cta-bg": `url(${landingCodeReview})` }}
      >
        <div className="landing-cta-copy">
          <h2>Start your next secure-review session today</h2>
          <p>
            Run demo challenges now and move to full training tracks when your team is ready.
          </p>
        </div>
        <div className="landing-actions">
          <button type="button" className="button-primary" onClick={() => onNavigate("/demo")}>
            Explore Demo
          </button>
          <button type="button" className="button-ghost" onClick={() => onNavigate("/register")}>
            Create Account
          </button>
        </div>
      </section>

      <footer className="landing-footer landing-footer-premium">
        <div className="landing-footer-hero">
          <img src={logo} alt="" className="landing-footer-logo" width={56} height={56} />
          <div className="landing-footer-hero-copy">
            <strong className="landing-footer-title">reviewer</strong>
            <p>
              Secure code review training for developers and security researchers. Practice real
              stacks, sharpen review instincts, and ship safer software.
            </p>
          </div>
        </div>
        <div className="landing-footer-grid">
          <div className="landing-footer-column">
            <h4>Platform</h4>
            <button type="button" onClick={() => onNavigate("/demo")}>
              Demo Challenges
            </button>
            <button type="button" onClick={() => onNavigate("/learn")}>
              Learn Tracks
            </button>
            <button type="button" onClick={() => onNavigate("/leaderboard")}>
              Leaderboard
            </button>
            <button type="button" onClick={() => onNavigate("/register")}>
              Create account
            </button>
          </div>
          <div className="landing-footer-column">
            <h4>Use Cases</h4>
            <p>Developer onboarding</p>
            <p>Security awareness</p>
            <p>Secure review drills</p>
            <p>Team learning sessions</p>
          </div>
          <div className="landing-footer-column">
            <h4>Coverage</h4>
            <p>API and backend services</p>
            <p>Frontend and modern web apps</p>
            <p>AI, MCP, and cloud review paths</p>
          </div>
          <div className="landing-footer-column">
            <h4>Product</h4>
            <p>Hands-on challenges</p>
            <p>Progress and leaderboard</p>
            <p>Admin challenge uploads</p>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>© {new Date().getFullYear()} reviewer · Secure review trainer</p>
          <p className="landing-footer-tagline">Train the way you review in production.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
