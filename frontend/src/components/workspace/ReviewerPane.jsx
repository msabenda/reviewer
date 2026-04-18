import EmptyState from "../common/EmptyState";
import ChallengeOverview from "../review/ChallengeOverview";
import CodeReviewPanel from "../review/CodeReviewPanel";
import SubmissionPanel from "../review/SubmissionPanel";

function ReviewerPane({
  activeChallengeId,
  loadingChallengeDetail,
  activeChallenge,
  codeLines,
  selectedSet,
  selectedCount,
  onToggleLine,
  lineStateClass,
  attemptStats,
  onSubmit,
  isSubmitting,
  onClear,
  submission,
  challengePoints,
  hasNextChallenge,
  onNextChallenge,
}) {
  if (!activeChallengeId) {
    return (
      <section className="reviewer-pane">
        <EmptyState
          title="No challenge selected"
          description="Select a challenge from the dropdown above to begin."
        />
      </section>
    );
  }

  if (loadingChallengeDetail) {
    return (
      <section className="reviewer-pane">
        <EmptyState title="Loading challenge..." />
      </section>
    );
  }

  if (!activeChallenge) {
    return (
      <section className="reviewer-pane">
        <EmptyState
          title="Challenge unavailable"
          description="Please select another challenge from the list."
        />
      </section>
    );
  }

  return (
    <section className="reviewer-pane">
      <div className="reviewer-main">
        <ChallengeOverview challenge={activeChallenge} />
        <div className="reviewer-grid">
          <CodeReviewPanel
            fileName={activeChallenge.file_name}
            fileTree={activeChallenge.file_tree}
            codeLines={codeLines}
            selectedSet={selectedSet}
            selectedCount={selectedCount}
            onToggleLine={onToggleLine}
            lineStateClass={lineStateClass}
            owaspCount={activeChallenge.owasp_tags.length}
          />
          <SubmissionPanel
            attemptStats={attemptStats}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onClear={onClear}
            hints={activeChallenge.hints}
            submission={submission}
            challengePoints={challengePoints}
            selectedCount={selectedCount}
            hasNextChallenge={hasNextChallenge}
            onNextChallenge={onNextChallenge}
          />
        </div>
      </div>
    </section>
  );
}

export default ReviewerPane;
