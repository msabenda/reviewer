function FeatureGrid({ items }) {
  return (
    <section className="feature-grid" aria-label="Platform highlights">
      {items.map((item) => (
        <article key={item.title} className="feature-card">
          <p className="feature-kicker">{item.kicker}</p>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </article>
      ))}
    </section>
  );
}

export default FeatureGrid;
