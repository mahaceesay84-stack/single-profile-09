type ThemeToggleProps = {
  isLight: boolean;
  onToggle: () => void;
  className?: string;
};

export function ThemeToggle({
  isLight,
  onToggle,
  className = "",
}: ThemeToggleProps) {
  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      type="button"
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      aria-pressed={isLight}
      onClick={onToggle}
    >
      {isLight ? (
        <svg
          aria-hidden="true"
          className="theme-toggle__icon"
          key="moon"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="theme-toggle__icon"
          key="sun"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="4"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      )}
    </button>
  );
}
