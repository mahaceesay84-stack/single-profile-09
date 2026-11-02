export const welcomeBubbleConfig = {
  enabled: true,
  firstDelayMs: 3000,
  idleTimeoutMs: 16000,
  visibleMs: 4000,
  gapMs: 3000,
  maxAppearances: 5,
  messages: [
    "Welcome! Have any questions about Muhammed's work?",
    "Want a quick tour of his projects?",
    "Ask me anything about his skills.",
  ] as const,
} as const;
