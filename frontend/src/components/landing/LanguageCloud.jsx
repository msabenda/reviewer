function LanguageCloud({ languages }) {
  return (
    <section className="language-cloud" aria-label="Supported stacks">
      <p className="section-label">Training Stacks</p>
      <div className="language-cloud-list">
        {languages.map((language) => (
          <span key={language} className="language-pill">
            {language}
          </span>
        ))}
      </div>
    </section>
  );
}

export default LanguageCloud;
