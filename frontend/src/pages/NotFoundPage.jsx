function NotFoundPage({ onNavigate }) {
  return (
    <section className="not-found-page">
      <p className="section-label">404</p>
      <h1>Page not found</h1>
      <p>The route you requested does not exist in reviewer.</p>
      <button type="button" className="button-primary" onClick={() => onNavigate("/")}>
        Back to Home
      </button>
    </section>
  );
}

export default NotFoundPage;
