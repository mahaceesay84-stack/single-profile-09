export const welcomeBubbleConfig = {
  enabled: true,
  firstDelayMs: 3000,
  idleTimeoutMs: 16000,
  visibleMs: 4000,
  gapMs: 3000,
  maxAppearances: 5,
  dismissDays: 7,
  dismissedSessionKey: "portfolio-welcome-dismissed",
  dismissedUntilKey: "portfolio-welcome-dismissed-until",
  stoppedSessionKey: "portfolio-welcome-stopped",
  appearancesSessionKey: "portfolio-welcome-appearances",
  messages: [
    "Welcome! Have any questions about Muhammed's work?",
    "Want a quick tour of his projects?",
    "Ask me anything about his skills.",
  ] as const,
} as const;
