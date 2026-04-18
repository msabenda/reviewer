import ChallengeCard from "./ChallengeCard";
import { formatCategoryFromId } from "../../utils/formatters";

function ChallengeSidebar({
  loadingBoot,
  error,
  challenges,
  activeChallengeId,
  categoryById,
  onSelectChallenge,
}) {
  const activeChallenge = challenges.find((challenge) => challenge.id === activeChallengeId);

  return (
    <aside className="challenge-sidebar">
      <header className="sidebar-header">
        <h2>Challenge Library</h2>
        <p>Pick a challenge to begin secure review practice.</p>
      </header>

      <div className="sidebar-focus-card">
        <p className="section-label">Current focus</p>
        <h3>{activeChallenge?.title || "Select a challenge"}</h3>
        <p>
          {activeChallenge
            ? `${activeChallenge.points} pts · ${activeChallenge.duration_minutes} min · ${activeChallenge.language}`
            : "Use the list below to start your next secure review drill."}
        </p>
      </div>

      {loadingBoot ? <p className="status-text">Loading platform data...</p> : null}
      {error ? <p className="status-text error">{error}</p> : null}

      <div className="challenge-list">
        {challenges.map((challenge) => {
          const categoryTitle =
            categoryById.get(challenge.category)?.title ||
            formatCategoryFromId(challenge.category);

          return (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              isActive={challenge.id === activeChallengeId}
              categoryTitle={categoryTitle}
              onSelect={onSelectChallenge}
            />
          );
        })}
      </div>
    </aside>
  );
}

export default ChallengeSidebar;
