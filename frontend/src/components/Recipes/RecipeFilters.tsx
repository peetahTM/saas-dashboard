interface RecipeFiltersProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

const DIETARY_FILTERS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
];

const RecipeFilters: React.FC<RecipeFiltersProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  return (
    <div className="recipe-filters">
      <button
        className={`recipe-filters__btn ${activeFilter === null ? 'recipe-filters__btn--active' : ''}`}
        onClick={() => onFilterChange(null)}
      >
        All
      </button>
      {DIETARY_FILTERS.map((filter) => (
        <button
          key={filter.value}
          className={`recipe-filters__btn ${activeFilter === filter.value ? 'recipe-filters__btn--active' : ''}`}
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default RecipeFilters;
