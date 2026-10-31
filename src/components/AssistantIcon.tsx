import { useEffect, useRef, useState } from "react";
import "./AssistantIcon.css";

export type AssistantIconState =
  "idle" | "hover" | "thinking" | "answering" | "error";

type AssistantIconProps = {
  state: AssistantIconState;
  size: number;
  lookAround?: boolean;
  blinkOnMount?: boolean;
};

export function AssistantIcon({
  state,
  size,
  lookAround = false,
  blinkOnMount = false,
}: AssistantIconProps) {
  const iconRef = useRef<SVGSVGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [tabVisible, setTabVisible] = useState(
    () => document.visibilityState === "visible",
  );

  useEffect(() => {
    const icon = iconRef.current;
    if (!icon) return;
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updateMotionPreference = () =>
      setReducedMotion(motionPreference.matches);
    const updateTabVisibility = () =>
      setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", updateTabVisibility);
    motionPreference.addEventListener("change", updateMotionPreference);
    if (!("IntersectionObserver" in window)) {
      setIsActive(true);
      return () => {
        document.removeEventListener("visibilitychange", updateTabVisibility);
        motionPreference.removeEventListener("change", updateMotionPreference);
      };
    }
    const observer = new IntersectionObserver(([entry]) =>
      setIsActive(Boolean(entry?.isIntersecting)),
    );
    observer.observe(icon);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateTabVisibility);
      motionPreference.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (blinkOnMount && !reducedMotion) {
      setIsBlinking(true);
      const timeout = window.setTimeout(() => setIsBlinking(false), 180);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [blinkOnMount, reducedMotion]);

  useEffect(() => {
    if (
      state !== "idle" ||
      !isActive ||
      !tabVisible ||
      reducedMotion ||
      isBlinking
    ) {
      return;
    }
    const timeout = window.setTimeout(
      () => setIsBlinking(true),
      4000 + Math.random() * 2000,
    );
    return () => window.clearTimeout(timeout);
  }, [isActive, isBlinking, reducedMotion, state, tabVisible]);

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!lookAround || reducedMotion || !isActive || !tabVisible) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    const icon = iconRef.current;
    const eyes = eyesRef.current;
    if (!icon || !eyes) return;
    const bounds = icon.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    eyes.style.transform = `translate(${Math.max(-3, Math.min(3, x * 3))}px, ${Math.max(-2, Math.min(2, y * 2))}px)`;
  };

  const resetGaze = () => {
    if (eyesRef.current) eyesRef.current.style.transform = "translate(0, 0)";
  };
  const resolvedState = state === "hover" ? "hover" : state;

  return (
    <svg
      aria-hidden="true"
      className="assistant-icon transition-transform duration-assistant-hover"
      data-active={isActive && tabVisible}
      data-state={resolvedState}
      height={size}
      onPointerLeave={resetGaze}
      onPointerMove={handlePointerMove}
      ref={iconRef}
      viewBox="0 0 48 48"
      width={size}
    >
      <path
        className="assistant-icon__bubble"
        d="M10 5h28a5 5 0 0 1 5 5v21a5 5 0 0 1-5 5H20l-9 7v-7h-1a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5Z"
      />
      <rect
        className={`assistant-icon__visor${state === "thinking" ? " animate-assistant-chat-thinking-fade" : ""}`}
        x="11"
        y="13"
        width="26"
        height="16"
        rx="4"
      />
      <g
        className={`assistant-icon__eyes${isBlinking ? " animate-assistant-chat-blink" : ""}${state === "thinking" ? " animate-assistant-chat-scan" : ""}${state === "answering" ? " animate-assistant-chat-breathe" : ""}`}
        ref={eyesRef}
      >
        <ellipse cx="19" cy="21" rx="2.5" ry="4" />
        <ellipse cx="29" cy="21" rx="2.5" ry="4" />
      </g>
      {state === "error" && (
        <circle className="assistant-icon__error-dot" cx="39" cy="36" r="3" />
      )}
    </svg>
  );
}
