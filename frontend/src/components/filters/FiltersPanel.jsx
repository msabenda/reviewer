import { TRACK_LABEL } from "../../constants/ui";

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
      <div className="search-wrap">
        <label className="field-label">
          Search
          <input
            className="search-input"
            type="search"
            value={filters.search}
            onChange={(event) => onFilterChange("search", event.target.value)}
            placeholder="Search by language, framework, or vulnerability"
          />
        </label>
      </div>

      <label className="field-label">
        Track
        <select value={filters.track} onChange={(event) => onFilterChange("track", event.target.value)}>
          <option value="">All Tracks</option>
          {filtersOptions.tracks.map((track) => (
            <option key={track} value={track}>
              {TRACK_LABEL[track] || track.toUpperCase()}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Language
        <select
          value={filters.language}
          onChange={(event) => onFilterChange("language", event.target.value)}
        >
          <option value="">All Languages</option>
          {filtersOptions.languages.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Difficulty
        <select
          value={filters.difficulty}
          onChange={(event) => onFilterChange("difficulty", event.target.value)}
        >
          <option value="">All Levels</option>
          {filtersOptions.difficulties.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Category
        <select
          value={filters.category}
          onChange={(event) => onFilterChange("category", event.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
      </label>

      <div className="filters-actions">
        <button type="button" className="button-ghost" onClick={onReset}>
          Reset Filters
        </button>
        <p>{loadingChallenges ? "Refreshing challenge list..." : `${challengeCount} matches`}</p>
      </div>
    </section>
  );
}

export default FiltersPanel;
