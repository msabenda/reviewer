function StatCard({ label, value, suffix = "" }) {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">
        {value}
        {suffix ? <span>{suffix}</span> : null}
      </p>
    </article>
  );
}

export default StatCard;
