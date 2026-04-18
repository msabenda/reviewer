import { useMemo } from "react";

import StatCard from "../common/StatCard";
import FiltersPanel from "../filters/FiltersPanel";
import TrackGrid from "../tracks/TrackGrid";
import ReviewerPane from "./ReviewerPane";
import { useReviewerApp } from "../../hooks/useReviewerApp";

function getRank(level) {
  if (level >= 8) {
    return "Architect";
  }
  if (level >= 6) {
    return "Sentinel";
  }
  if (level >= 4) {
    return "Defender";
  }
  return "Analyst";
}

function TrainingWorkspace({
  mode,
  csrfToken = "",
  title,
  subtitle,
  ctaLabel,
  onCta,
  compact = false,
  /** "minimal" = single-row hero for signed-in training (less noise than full dashboard). */
  heroVariant = "full",
}) {
  const {
    meta,
    categories,
    filtersOptions,
    filters,
    setFilter,
    resetFilters,
    challenges,
    activeChallengeId,
    setActiveChallengeId,
    activeChallenge,
    codeLines,
    attemptStats,
    selectedSet,
    selectedLines,
    toggleLine,
    lineStateClass,
    submission,
    submitReview,
    clearSelection,
    loadingBoot,
    loadingChallenges,
    loadingChallengeDetail,
    isSubmitting,
    error,
  } = useReviewerApp({ mode, csrfToken, enabled: true });

  const playerStats = useMemo(() => {
    const score = submission?.score || 0;
    const level = Math.max(1, Math.round((attemptStats.success_rate + score / 2) / 15));
    const progress = Math.min(100, Math.max(8, Math.round((attemptStats.success_rate + score) / 1.4)));
    const streak = submission?.passed ? Math.max(1, attemptStats.successful_attempts) : 0;

    return {
      level,
      progress,
      streak,
      rank: getRank(level),
    };
  }, [attemptStats.success_rate, attemptStats.successful_attempts, submission]);

  const nextChallengeId = useMemo(() => {
    if (!activeChallengeId || !challenges.length) {
      return "";
    }
    const index = challenges.findIndex((challenge) => challenge.id === activeChallengeId);
    if (index < 0) {
      return challenges[0]?.id || "";
    }
    return challenges[index + 1]?.id || "";
  }, [activeChallengeId, challenges]);

  const previousChallengeId = useMemo(() => {
    if (!activeChallengeId || !challenges.length) {
      return "";
    }
    const index = challenges.findIndex((challenge) => challenge.id === activeChallengeId);
    if (index <= 0) {
      return "";
    }
    return challenges[index - 1]?.id || "";
  }, [activeChallengeId, challenges]);

  function toggleCategory(categoryId, isActive) {
    setFilter("category", isActive ? "" : categoryId);
  }

  const isMinimalHero = !compact && heroVariant === "minimal";

  return (
    <div className={`workspace-page ${compact ? "is-compact" : ""} ${isMinimalHero ? "has-minimal-hero" : ""}`}>
      {!compact && isMinimalHero ? (
        <section className="workspace-hero-minimal" id="library">
          <div className="workspace-hero-minimal-main">
            <p className="section-label">{mode === "demo" ? "Guest" : "Training"}</p>
            <h1>{title}</h1>
            <p className="workspace-hero-minimal-copy">{subtitle}</p>
          </div>
          <dl className="workspace-hero-minimal-stats">
            <div>
              <dt>Library</dt>
              <dd>{meta?.available_now ?? "—"}</dd>
            </div>
            <div>
              <dt>Your success</dt>
              <dd>{attemptStats.success_rate}%</dd>
            </div>
            <div>
              <dt>Rank</dt>
              <dd>{playerStats.rank}</dd>
            </div>
            <div>
              <dt>Level</dt>
              <dd>{playerStats.level}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {!compact && !isMinimalHero ? (
        <>
          <section className="workspace-hero-card" id="library">
            <div className="workspace-hero-main">
              <p className="section-label">{mode === "demo" ? "Guest Arena" : "Pro Arena"}</p>
              <h1>{title}</h1>
              <p className="workspace-hero-copy">{subtitle}</p>

              <div className="level-strip">
                <div>
                  <p className="level-label">Current Rank</p>
                  <p className="level-value">{playerStats.rank}</p>
                </div>
                <div
                  className="progress-wrap"
                  role="progressbar"
                  aria-valuenow={playerStats.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="progress-track">
                    <span style={{ width: `${playerStats.progress}%` }} />
                  </div>
                  <p>{playerStats.progress}% to next rank</p>
                </div>
              </div>

              {ctaLabel && onCta ? (
                <button type="button" className="button-primary" onClick={onCta}>
                  {ctaLabel}
                </button>
              ) : null}
            </div>

            <div className="workspace-hero-stats">
              <StatCard label="Available" value={meta?.available_now ?? "--"} />
              <StatCard label="Planned" value={meta?.coming_soon ?? "--"} />
              <StatCard label="Hours" value={meta?.content_hours ?? "--"} suffix="h+" />
              <StatCard label="Categories" value={meta?.topic_categories ?? "--"} />
              <StatCard label="Level" value={playerStats.level} />
              <StatCard label="Streak" value={playerStats.streak} suffix="x" />
            </div>
          </section>
        </>
      ) : null}

      {!compact ? (
        <>
          <FiltersPanel
            filters={filters}
            filtersOptions={filtersOptions}
            categories={categories}
            onFilterChange={setFilter}
            onReset={resetFilters}
            loadingChallenges={loadingChallenges}
            challengeCount={challenges.length}
          />

          {!isMinimalHero ? (
            <TrackGrid
              categories={categories}
              activeCategory={filters.category}
              onToggleCategory={toggleCategory}
            />
          ) : null}
        </>
      ) : null}

      <section className={`workspace-shell ${compact ? "is-compact" : ""}`} id="workspace">
        <div className="workspace-playbar">
          <label className="field-label">
            Challenge
            <select
              value={activeChallengeId}
              onChange={(event) => setActiveChallengeId(event.target.value)}
              disabled={loadingBoot || !challenges.length}
            >
              {!challenges.length ? <option value="">No challenges found</option> : null}
              {challenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </option>
              ))}
            </select>
          </label>
          <p className="workspace-playbar-hint">
            {error
              ? error
              : loadingBoot
                ? "Loading challenge data…"
                : isMinimalHero && mode === "training"
                  ? "List order: SDLC phase → week → difficulty. Pick a challenge to open the reviewer."
                  : "Select a challenge and review code."}
          </p>
          <div className="workspace-nav-actions">
            <button
              type="button"
              className="button-ghost"
              onClick={() => previousChallengeId && setActiveChallengeId(previousChallengeId)}
              disabled={!previousChallengeId}
            >
              ← Previous
            </button>
            <button
              type="button"
              className="button-primary"
              onClick={() => nextChallengeId && setActiveChallengeId(nextChallengeId)}
              disabled={!nextChallengeId}
            >
              Next →
            </button>
          </div>
        </div>
        <ReviewerPane
          activeChallengeId={activeChallengeId}
          loadingChallengeDetail={loadingChallengeDetail}
          activeChallenge={activeChallenge}
          codeLines={codeLines}
          selectedSet={selectedSet}
          selectedCount={selectedLines.length}
          onToggleLine={toggleLine}
          lineStateClass={lineStateClass}
          attemptStats={attemptStats}
          onSubmit={submitReview}
          isSubmitting={isSubmitting}
          onClear={clearSelection}
          submission={submission}
          challengePoints={activeChallenge?.points || 0}
          hasNextChallenge={Boolean(nextChallengeId)}
          onNextChallenge={nextChallengeId ? () => setActiveChallengeId(nextChallengeId) : null}
        />
      </section>
    </div>
  );
}

export default TrainingWorkspace;
