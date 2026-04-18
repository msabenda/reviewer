function EmptyState({ title, description }) {
  return (
    <article className="empty-state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </article>
  );
}

export default EmptyState;
