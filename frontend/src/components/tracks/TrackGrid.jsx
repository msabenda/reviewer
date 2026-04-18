import { ICON_TEXT } from "../../constants/ui";

function TrackGrid({ categories, activeCategory, onToggleCategory }) {
  return (
    <section className="track-grid" id="tracks">
      {categories.map((category) => {
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            type="button"
            className={`track-card ${isActive ? "is-active" : ""}`}
            style={{ "--track-accent": category.accent }}
            onClick={() => onToggleCategory(category.id, isActive)}
          >
            <p className="track-icon">{ICON_TEXT[category.icon] || "SEC"}</p>
            <h3>{category.title}</h3>
            <p>{category.subtitle}</p>
            <p className="track-meta">
              {category.available_count} available | {category.coming_soon_count} coming soon
            </p>
          </button>
        );
      })}
    </section>
  );
}

export default TrackGrid;
