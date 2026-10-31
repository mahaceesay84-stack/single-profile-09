import { useEffect } from "react";
import "./WelcomeBubble.css";

type WelcomeBubbleProps = {
  isVisible: boolean;
  message: string;
  onOpenChat: () => void;
  onDismiss: () => void;
  onEscape: () => void;
};

export function WelcomeBubble({
  isVisible,
  message,
  onOpenChat,
  onDismiss,
  onEscape,
}: WelcomeBubbleProps) {
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onEscape]);

  return (
    <div
      aria-hidden={!isVisible}
      aria-live="polite"
      className={`welcome-bubble ${isVisible ? "animate-assistant-bubble-enter" : "animate-assistant-bubble-exit"}`}
      data-visible={isVisible}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("button")) {
          return;
        }
        onOpenChat();
      }}
      role="status"
    >
      <div
        className={`welcome-bubble__float${isVisible ? " animate-assistant-bubble-float" : ""}`}
      >
        <svg
          aria-hidden="true"
          className="welcome-bubble__shape"
          preserveAspectRatio="none"
          viewBox="0 0 280 180"
        >
          <path d="M59 12c-16 0-28 11-29 26C14 39 5 52 5 67c0 16 12 28 28 29-1 17 12 30 29 30h141c15 0 27-9 30-23 17-2 32-15 32-33 0-17-11-30-27-32-2-16-15-27-32-27-11-11-29-10-40 0-12-10-29-10-41 0-12-9-29-8-38 4-9-6-19-7-28-3Z" />
          <path
            className="welcome-bubble__tail"
            d="M202 125c12 1 23-6 30-17 10 12 20 26 25 43-12-7-25-11-38-10-5-7-11-12-17-16"
          />
        </svg>
        <div className="welcome-bubble__content">
          <div className="welcome-bubble__top">
            <button
              aria-label="Dismiss welcome message"
              className="welcome-bubble__close"
              onClick={onDismiss}
              tabIndex={isVisible ? 0 : -1}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>
          <button
            key={message}
            className="welcome-bubble__message"
            onClick={onOpenChat}
            tabIndex={isVisible ? 0 : -1}
            type="button"
          >
            {message}
          </button>
          <div className="welcome-bubble__actions">
            <button
              className="welcome-bubble__ask"
              onClick={onOpenChat}
              tabIndex={isVisible ? 0 : -1}
              type="button"
            >
              Ask a question
            </button>
            <button
              className="welcome-bubble__later"
              onClick={onDismiss}
              tabIndex={isVisible ? 0 : -1}
              type="button"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
