import StatCard from "../common/StatCard";

function HeroSection({ meta, playerStats }) {
  return (
    <section className="hero-section" id="library">
      <div className="hero-main">
        <p className="hero-kicker">Mission Control</p>
        <h1 className="hero-headline">reviewer</h1>
        <p className="hero-subtitle">
          Train developers with mission-based secure code reviews across OWASP Web, API, AI,
          and MCP attack surfaces.
        </p>

        <div className="level-strip">
          <div>
            <p className="level-label">Current Rank</p>
            <p className="level-value">{playerStats.rank}</p>
          </div>
          <div className="progress-wrap" role="progressbar" aria-valuenow={playerStats.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-track">
              <span style={{ width: `${playerStats.progress}%` }} />
            </div>
            <p>{playerStats.progress}% to next rank</p>
          </div>
        </div>
      </div>

      <div className="hero-stat-grid">
        <StatCard label="Available" value={meta?.available_now ?? "--"} />
        <StatCard label="Planned" value={meta?.coming_soon ?? "--"} />
        <StatCard label="Hours" value={meta?.content_hours ?? "--"} suffix="h+" />
        <StatCard label="Categories" value={meta?.topic_categories ?? "--"} />
        <StatCard label="Level" value={playerStats.level} />
        <StatCard label="Streak" value={playerStats.streak} suffix="x" />
      </div>
    </section>
  );
}

export default HeroSection;
