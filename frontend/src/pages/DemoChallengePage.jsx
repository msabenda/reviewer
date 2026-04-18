import TrainingWorkspace from "../components/workspace/TrainingWorkspace";

function DemoChallengePage({ onNavigate }) {
  return (
    <TrainingWorkspace
      mode="demo"
      compact
      title="Demo Challenge Arena"
      subtitle="Demo challenge focus mode"
      ctaLabel="Unlock Full Learning"
      onCta={() => onNavigate("/register")}
    />
  );
}

export default DemoChallengePage;
