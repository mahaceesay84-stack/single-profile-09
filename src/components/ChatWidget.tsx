import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AssistantIcon } from "./AssistantIcon";
import { WelcomeBubble } from "./WelcomeBubble";
import "./ChatLauncher.css";
import { welcomeBubbleConfig } from "../data/welcome-bubble";

const ChatPanel = lazy(() => import("./ChatPanel"));
const apiUrl = import.meta.env.VITE_ASSISTANT_API_URL ?? "";

const assistantEnabled =
  import.meta.env.VITE_ASSISTANT_ENABLED === "true" && Boolean(apiUrl);

let fallbackStoppedForSession = false;
let fallbackDismissedForSession = false;
let fallbackAppearanceCount = 0;

function hasRecentDismissal(): boolean {
  let dismissedThisSession = fallbackDismissedForSession;
  try {
    dismissedThisSession =
      sessionStorage.getItem(welcomeBubbleConfig.dismissedSessionKey) ===
        "true" || dismissedThisSession;
  } catch {
    // Continue with the persistent dismissal value when session storage is blocked.
  }
  try {
    const dismissedUntil = Number(
      localStorage.getItem(welcomeBubbleConfig.dismissedUntilKey),
    );
    return dismissedThisSession || dismissedUntil > Date.now();
  } catch {
    return dismissedThisSession;
  }
}

function hasStoppedForSession(): boolean {
  try {
    return (
      sessionStorage.getItem(welcomeBubbleConfig.stoppedSessionKey) ===
        "true" || fallbackStoppedForSession
    );
  } catch {
    return fallbackStoppedForSession;
  }
}

function getAppearanceCount(): number {
  try {
    const value = Number(
      sessionStorage.getItem(welcomeBubbleConfig.appearancesSessionKey),
    );
    return Number.isFinite(value)
      ? Math.max(value, fallbackAppearanceCount)
      : fallbackAppearanceCount;
  } catch {
    return fallbackAppearanceCount;
  }
}

function persistSessionValue(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Module state remains authoritative when session storage is unavailable.
  }
}

function rememberSessionStop(): void {
  fallbackStoppedForSession = true;
  persistSessionValue(welcomeBubbleConfig.stoppedSessionKey, "true");
}

function rememberDismissal(): void {
  fallbackDismissedForSession = true;
  rememberSessionStop();
  persistSessionValue(welcomeBubbleConfig.dismissedSessionKey, "true");
  try {
    const expiry =
      Date.now() + welcomeBubbleConfig.dismissDays * 24 * 60 * 60 * 1000;
    localStorage.setItem(welcomeBubbleConfig.dismissedUntilKey, String(expiry));
  } catch {
    // The session flag still prevents further greetings in this tab.
  }
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [launcherActive, setLauncherActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    welcomeBubbleConfig.messages[0],
  );
  const [startDiscovery, setStartDiscovery] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dismissWelcomeRef = useRef<() => void>(() => {});
  const stopWelcomeRef = useRef<() => void>(() => {});
  const isOpenRef = useRef(isOpen);
  const welcomeVisibleRef = useRef(welcomeVisible);
  isOpenRef.current = isOpen;
  welcomeVisibleRef.current = welcomeVisible;

  useEffect(() => {
    const launcher = triggerRef.current;
    if (!launcher) return;

    const updateVisibility = () => {
      setLauncherActive(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => {
      setLauncherActive(
        Boolean(entry?.isIntersecting) &&
          document.visibilityState === "visible",
      );
    });
    observer.observe(launcher);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const navigation = document.getElementById("primary-navigation");
    if (!navigation) return;
    const updateMenuState = () =>
      setMobileMenuOpen(navigation.classList.contains("is-open"));
    updateMenuState();
    const observer = new MutationObserver(updateMenuState);
    observer.observe(navigation, {
      attributeFilter: ["class"],
      attributes: true,
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      !assistantEnabled ||
      !welcomeBubbleConfig.enabled ||
      isOpenRef.current ||
      hasRecentDismissal() ||
      hasStoppedForSession()
    ) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    let idleCallbackId: number | undefined;
    let pendingAction: (() => void) | null = null;
    let remainingDelay = 0;
    let timerDeadline = 0;
    let appearances = getAppearanceCount();
    let isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const clearTimer = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      pendingAction = null;
      remainingDelay = 0;
    };
    const stopCycle = () => {
      if (cancelled) return;
      cancelled = true;
      clearTimer();
      if (idleCallbackId !== undefined) {
        idleWindow.cancelIdleCallback?.(idleCallbackId);
        idleCallbackId = undefined;
      }
      rememberSessionStop();
      setWelcomeVisible(false);
    };
    const dismiss = () => {
      rememberDismissal();
      stopCycle();
    };
    stopWelcomeRef.current = stopCycle;
    dismissWelcomeRef.current = dismiss;

    const schedule = (delay: number, action: () => void) => {
      pendingAction = action;
      remainingDelay = delay;
      if (document.visibilityState === "hidden" || cancelled) return;
      timerDeadline = Date.now() + delay;
      timer = window.setTimeout(() => {
        timer = undefined;
        if (document.visibilityState === "hidden") {
          remainingDelay = 0;
          return;
        }
        pendingAction = null;
        remainingDelay = 0;
        action();
      }, delay);
    };

    const stopWhenFinished = () => {
      const maxAppearances = isReducedMotion
        ? 1
        : welcomeBubbleConfig.maxAppearances;
      if (appearances >= maxAppearances) {
        stopCycle();
      } else {
        schedule(welcomeBubbleConfig.gapMs, show);
      }
    };

    const show = () => {
      if (cancelled || isOpenRef.current) return;
      if (appearances >= welcomeBubbleConfig.maxAppearances) {
        stopCycle();
        return;
      }
      appearances += 1;
      fallbackAppearanceCount = appearances;
      persistSessionValue(
        welcomeBubbleConfig.appearancesSessionKey,
        String(appearances),
      );
      setWelcomeMessage(
        welcomeBubbleConfig.messages[
          (appearances - 1) % welcomeBubbleConfig.messages.length
        ],
      );
      setWelcomeVisible(true);
      schedule(welcomeBubbleConfig.visibleMs, () => {
        setWelcomeVisible(false);
        stopWhenFinished();
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timer !== undefined) {
          remainingDelay = Math.max(0, timerDeadline - Date.now());
          window.clearTimeout(timer);
          timer = undefined;
        }
        return;
      }
      if (timer === undefined && pendingAction && !cancelled) {
        const action = pendingAction;
        schedule(remainingDelay, action);
      }
    };

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const handleMotionChange = (event: MediaQueryListEvent) => {
      isReducedMotion = event.matches;
      if (isReducedMotion && appearances >= 1 && !welcomeVisibleRef.current) {
        stopCycle();
      }
    };
    const checkMobileMenu = () => {
      const navigation = document.getElementById("primary-navigation");
      if (navigation?.classList.contains("is-open")) stopCycle();
    };
    const navigation = document.getElementById("primary-navigation");
    const menuObserver =
      navigation &&
      new MutationObserver(() => {
        if (navigation.classList.contains("is-open")) stopCycle();
      });
    if (navigation && menuObserver) {
      menuObserver.observe(navigation, {
        attributeFilter: ["class"],
        attributes: true,
      });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionPreference.addEventListener("change", handleMotionChange);
    checkMobileMenu();

    const startFirstAppearance = () => {
      const beginDelay = () => {
        schedule(welcomeBubbleConfig.firstDelayMs, show);
      };
      if (idleWindow.requestIdleCallback) {
        idleCallbackId = idleWindow.requestIdleCallback(
          () => {
            idleCallbackId = undefined;
            beginDelay();
          },
          { timeout: welcomeBubbleConfig.idleTimeoutMs },
        );
      } else {
        beginDelay();
      }
    };

    if (appearances >= welcomeBubbleConfig.maxAppearances) {
      stopCycle();
    } else if (document.readyState === "complete") {
      startFirstAppearance();
    } else {
      window.addEventListener("load", startFirstAppearance, { once: true });
    }

    return () => {
      cancelled = true;
      clearTimer();
      if (idleCallbackId !== undefined) {
        idleWindow.cancelIdleCallback?.(idleCallbackId);
      }
      window.removeEventListener("load", startFirstAppearance);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionPreference.removeEventListener("change", handleMotionChange);
      menuObserver?.disconnect();
      dismissWelcomeRef.current = () => {};
      stopWelcomeRef.current = () => {};
    };
  }, []);

  const openFromWelcome = () => {
    stopWelcomeRef.current();
    rememberSessionStop();
    setWelcomeVisible(false);
    setStartDiscovery(true);
    setIsOpen(true);
  };

  const openFromLauncher = () => {
    stopWelcomeRef.current();
    rememberSessionStop();
    setWelcomeVisible(false);
    setStartDiscovery(true);
    setIsOpen(true);
  };

  if (!assistantEnabled) return null;

  return (
    <>
      <div
        className="assistant-widget"
        data-chat-open={isOpen}
        data-menu-open={mobileMenuOpen}
      >
        <button
          aria-label="Ask AI about Muhammed"
          className="assistant-launcher"
          onClick={openFromLauncher}
          ref={triggerRef}
          type="button"
        >
          <span
            aria-hidden="true"
            className="assistant-launcher__ring animate-assistant-chat-ring"
            data-active={launcherActive}
          />
          <AssistantIcon
            blinkOnMount={welcomeVisible}
            key={welcomeVisible ? "welcome" : "idle"}
            lookAround
            size={48}
            state="idle"
          />
        </button>
        <WelcomeBubble
          isVisible={welcomeVisible && !isOpen}
          message={welcomeMessage}
          onDismiss={() => dismissWelcomeRef.current()}
          onEscape={() => stopWelcomeRef.current()}
          onOpenChat={openFromWelcome}
        />
      </div>
      {isOpen && (
        <Suspense
          fallback={
            <div className="assistant-loading" role="status">
              Opening assistant…
            </div>
          }
        >
          <ChatPanel
            apiUrl={apiUrl}
            discoveryMode={startDiscovery}
            onClose={() => {
              setIsOpen(false);
              setStartDiscovery(false);
            }}
            triggerRef={triggerRef}
          />
        </Suspense>
      )}
    </>
  );
}
