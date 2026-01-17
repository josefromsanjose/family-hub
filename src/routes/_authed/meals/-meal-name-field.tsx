import { useMemo, useState } from "react";
type MealLibraryOption = {
  id: string;
  name: string;
  notes?: string;
};

type MealNameFieldProps = {
  value: string;
  suggestions: MealLibraryOption[];
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: MealLibraryOption) => void;
};

const MAX_SUGGESTIONS = 6;

export function MealNameField({
  value,
  suggestions,
  autoFocus,
  onChange,
  onSelectSuggestion,
}: MealNameFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const normalizedValue = value.trim().toLowerCase();

  const filteredSuggestions = useMemo(() => {
    if (suggestions.length === 0) return [];
    const filtered = normalizedValue
      ? suggestions.filter((suggestion) =>
          suggestion.name.toLowerCase().includes(normalizedValue)
        )
      : suggestions;
    return filtered.slice(0, MAX_SUGGESTIONS);
  }, [normalizedValue, suggestions]);

  const showSuggestions = isFocused && filteredSuggestions.length > 0;

  return (
    <div className="space-y-2">
      <label htmlFor="meal-name" className="text-sm font-medium text-foreground">
        Meal Name
      </label>
      <input
        id="meal-name"
        type="text"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        placeholder="e.g., Spaghetti and Meatballs"
        className="w-full rounded-xl border border-input bg-background px-4 py-4 text-lg focus:ring-2 focus:ring-ring focus:border-transparent"
      />
      {showSuggestions && (
        <div className="rounded-xl border border-border bg-background shadow-sm">
          <ul className="max-h-60 overflow-auto">
            {filteredSuggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelectSuggestion(suggestion);
                    setIsFocused(false);
                  }}
                  aria-label={`Select ${suggestion.name}`}
                >
                  <p className="text-sm font-medium text-foreground">
                    {suggestion.name}
                  </p>
                  {suggestion.notes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.notes}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
