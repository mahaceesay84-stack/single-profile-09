/** @type {import('tailwindcss').Config} */
const profileEasing = "cubic-bezier(0.22, 1, 0.36, 1)";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  safelist: [
    "animate-profile-card-enter",
    "animate-profile-photo-enter",
    "animate-profile-caption-enter",
    "animate-profile-badge-enter",
    "animate-profile-ring-draw",
    "animate-profile-glow-breathe",
    "animate-profile-status-pulse",
    "animate-profile-reduced-fade",
    "animate-assistant-chat-blink",
    "animate-assistant-chat-ring",
    "animate-assistant-chat-scan",
    "animate-assistant-chat-breathe",
    "animate-assistant-chat-thinking-fade",
    "animate-assistant-bubble-enter",
    "animate-assistant-bubble-exit",
    "animate-assistant-bubble-float",
  ],
  theme: {
    extend: {
      colors: {
        page: "var(--page)",
        surface: "var(--surface)",
        text: "var(--text)",
        muted: "var(--muted)",
        border: "var(--line)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        error: "var(--error)",
        electric: "#4f8dff",
        availability: "var(--availability-green)",
      },
      boxShadow: {
        "profile-card":
          "0 24px 70px rgb(0 0 0 / 24%), inset 0 1px 0 rgb(255 255 255 / 5%)",
      },
      transitionDuration: {
        "profile-hover": "250ms",
        "assistant-hover": "200ms",
        "assistant-bubble-enter": "300ms",
        "assistant-bubble-exit": "200ms",
        "assistant-blink": "160ms",
        "assistant-scan": "1200ms",
        "assistant-breathe": "2400ms",
        "assistant-ring": "6000ms",
      },
      transitionTimingFunction: {
        "profile-hover": profileEasing,
      },
      keyframes: {
        "profile-card-enter": {
          from: { opacity: "0", transform: "translateY(1.5rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "profile-photo-enter": {
          from: { opacity: "0", transform: "scale(1.04)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "profile-caption-enter": {
          from: { opacity: "0", transform: "translateY(0.75rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "profile-badge-enter": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "profile-ring-draw": {
          from: { strokeDashoffset: "100" },
          to: { strokeDashoffset: "0" },
        },
        "profile-glow-breathe": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.55" },
        },
        "profile-status-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.25)" },
        },
        "profile-reduced-fade": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "assistant-chat-blink": {
          "0%, 100%": { transform: "scaleY(1)" },
          "45%, 55%": { transform: "scaleY(0.12)" },
        },
        "assistant-chat-ring": {
          "0%, 100%": { opacity: "0", transform: "scale(1)" },
          "50%": { opacity: "0.22", transform: "scale(1.14)" },
        },
        "assistant-chat-scan": {
          "0%, 100%": { transform: "translateX(-1px)" },
          "50%": { transform: "translateX(1px)" },
        },
        "assistant-chat-breathe": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        "assistant-chat-thinking-fade": {
          from: { opacity: "0.72" },
          to: { opacity: "1" },
        },
        "assistant-bubble-enter": {
          from: { opacity: "0", transform: "scale(0.85)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "assistant-bubble-exit": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "assistant-bubble-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        "profile-card-enter": `profile-card-enter 700ms ${profileEasing} both`,
        "profile-photo-enter": `profile-photo-enter 900ms ${profileEasing} 100ms both`,
        "profile-caption-enter": `profile-caption-enter 500ms ${profileEasing} 400ms both`,
        "profile-badge-enter": "profile-badge-enter 1s ease-out both",
        "profile-ring-draw": `profile-ring-draw 1s ${profileEasing} both`,
        "profile-glow-breathe": "profile-glow-breathe 6s ease-in-out infinite",
        "profile-status-pulse": "profile-status-pulse 2s ease-in-out infinite",
        "profile-reduced-fade": "profile-reduced-fade 200ms ease-out both",
        "assistant-chat-blink": "assistant-chat-blink 160ms ease-out both",
        "assistant-chat-ring": "assistant-chat-ring 6s ease-in-out infinite",
        "assistant-chat-scan": "assistant-chat-scan 1.2s ease-in-out infinite",
        "assistant-chat-breathe":
          "assistant-chat-breathe 2.4s ease-in-out infinite",
        "assistant-chat-thinking-fade":
          "assistant-chat-thinking-fade 1.2s ease-in-out infinite alternate",
        "assistant-bubble-enter":
          "assistant-bubble-enter 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "assistant-bubble-exit": "assistant-bubble-exit 200ms ease-in both",
        "assistant-bubble-float":
          "assistant-bubble-float 4s ease-in-out 300ms infinite",
      },
    },
  },
  plugins: [],
};
