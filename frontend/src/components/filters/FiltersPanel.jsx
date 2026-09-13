import { TRACK_LABEL } from "../../constants/ui";

const DIFFICULTY_EMOJI = {
  Beginner: "🌱",
  Intermediate: "🔥",
  Advanced: "💀",
};

function FiltersPanel({
  filters,
  filtersOptions,
  categories,
  onFilterChange,
  onReset,
  loadingChallenges,
  challengeCount,
}) {
  return (
    <section className="filters-panel">
      <div className="fp-header">
        <h3 className="fp-title">🧭 Challenge library</h3>
        <p className="fp-count">{loadingChallenges ? "..." : `${challengeCount} challenges`}</p>
      </div>

      <div className="fp-body">
        <label className="field-label fp-search">
          <input
            className="search-input"
            type="search"
            value={filters.search}
            onChange={(event) => onFilterChange("search", event.target.value)}
            placeholder="Search by language, framework, or vulnerability type…"
          />
        </label>

        <div className="fp-filters">
          <select value={filters.track} onChange={(e) => onFilterChange("track", e.target.value)}>
            <option value="">All tracks</option>
            {filtersOptions.tracks.map((track) => (
              <option key={track} value={track}>
                {TRACK_LABEL[track] || track.toUpperCase()}
              </option>
            ))}
          </select>

          <select value={filters.language} onChange={(e) => onFilterChange("language", e.target.value)}>
            <option value="">All languages</option>
            {filtersOptions.languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <select value={filters.difficulty} onChange={(e) => onFilterChange("difficulty", e.target.value)}>
            <option value="">All difficulties</option>
            {filtersOptions.difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {DIFFICULTY_EMOJI[diff] || ""} {diff}
              </option>
            ))}
          </select>

          <select value={filters.category} onChange={(e) => onFilterChange("category", e.target.value)}>
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.title}</option>
            ))}
          </select>
        </div>

        <div className="fp-actions">
          <button type="button" className="button-ghost fp-reset" onClick={onReset}>
            Reset filters
          </button>
        </div>
      </div>
    </section>
  );
}

export default FiltersPanel;
