import {
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  assistantDiscovery,
  discoverySummaries,
  intentFollowUpSteps,
  type DiscoveryIntent,
  type DiscoveryStep,
} from "../data/assistant-discovery";
import {
  assistantKnowledge,
  getApprovedFaqAnswer,
} from "../data/assistant-knowledge";
import { type ChatMessage, useChat } from "../hooks/useChat";
import { AssistantIcon, type AssistantIconState } from "./AssistantIcon";
import "./ChatPanel.css";

type ChatPanelProps = {
  apiUrl: string;
  discoveryMode: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

type FaqAction = { label: string; href: string } | null;

function TypingIndicator() {
  return (
    <span aria-label="Assistant is typing" className="assistant-typing">
      <span />
      <span />
      <span />
    </span>
  );
}

export function MessageBubble({
  message,
  isWaiting,
}: {
  message: ChatMessage;
  isWaiting: boolean;
}) {
  const isAssistant = message.role === "assistant";
  return (
    <div
      className={`assistant-message assistant-message--${message.role}`}
      aria-label={isAssistant ? "Muhammed's AI assistant" : "You"}
    >
      {message.content ? (
        <p>{message.content}</p>
      ) : (
        isWaiting && <TypingIndicator />
      )}
    </div>
  );
}

export default function ChatPanel({
  apiUrl,
  discoveryMode,
  onClose,
  triggerRef,
}: ChatPanelProps) {
  const { messages, isLoading, error, sendMessage, clearError, appendMessage } =
    useChat(apiUrl);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<DiscoveryStep>(
    discoveryMode ? "intent" : "chat",
  );
  const [discoveryQuestionCount, setDiscoveryQuestionCount] = useState(1);
  const [discoveryIntent, setDiscoveryIntent] =
    useState<DiscoveryIntent | null>(null);
  const [faqAction, setFaqAction] = useState<FaqAction>(null);
  const [formStatus, setFormStatus] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const eyeState: AssistantIconState = error
    ? "error"
    : isLoading
      ? lastAssistantMessage?.content
        ? "answering"
        : "thinking"
      : "idle";

  useEffect(() => {
    const trigger = triggerRef.current;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(
        window.getComputedStyle(body).paddingRight,
      );
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
    inputRef.current?.focus();
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      trigger?.focus();
    };
  }, [triggerRef]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, isLoading, step, formStatus]);

  const submit = async (value: string) => {
    const question = value.trim();
    if (!question || isLoading) return;
    setInput("");
    inputRef.current?.focus();
    if (/^skip$/i.test(question)) {
      appendMessage("user", question);
      appendMessage("assistant", "No problem. What else can I help you with?");
      setStep("chat");
      return;
    }

    const approvedFaq = getApprovedFaqAnswer(question);
    if (approvedFaq) {
      appendMessage("user", question);
      appendMessage("assistant", approvedFaq.answer);
      setFaqAction(approvedFaq.action ?? null);
      setStep("chat");
      return;
    }

    setFaqAction(null);
    const wasCollaborationDetail = step === "collaboration-detail";
    setStep("chat");
    await sendMessage(question);
    if (wasCollaborationDetail) {
      appendMessage("assistant", discoverySummaries.collaboration);
      if (discoveryQuestionCount < assistantDiscovery.maxQuestions) {
        setDiscoveryQuestionCount((count) => count + 1);
        setStep("consent");
      } else {
        setStep("chat");
      }
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(input);
  };

  const choose = (value: string, label: string) => {
    if (isLoading) return;
    setFaqAction(null);

    if (step === "intent") {
      const intentChoice = assistantDiscovery.steps.intent.choices.find(
        (choice) => choice.value === value && choice.label === label,
      );
      if (!intentChoice) return;
      const intent: DiscoveryIntent = intentChoice.value;
      appendMessage("user", label);
      setDiscoveryIntent(intent);
      if (discoveryQuestionCount >= assistantDiscovery.maxQuestions) {
        appendMessage("assistant", discoverySummaries[intent]);
        setStep("chat");
        return;
      }
      setDiscoveryQuestionCount((count) => count + 1);
      if (intent === "collaboration") {
        appendMessage("assistant", assistantDiscovery.collaborationQuestion);
        setStep("collaboration-detail");
        inputRef.current?.focus();
        return;
      }
      const followUpStep = intentFollowUpSteps[intent];
      setStep(followUpStep);
      return;
    }

    appendMessage("user", label);
    if (
      step === "hire-role" ||
      step === "project-goal" ||
      step === "explore-topic"
    ) {
      if (discoveryIntent) {
        appendMessage("assistant", discoverySummaries[discoveryIntent]);
        if (discoveryQuestionCount < assistantDiscovery.maxQuestions) {
          setDiscoveryQuestionCount((count) => count + 1);
          setStep("consent");
        } else {
          setStep("chat");
        }
      }
      return;
    }

    if (step === "consent") {
      if (value === "yes") {
        appendMessage(
          "assistant",
          "Please share your name and email if you'd like Muhammed to reply.",
        );
        setStep("lead-form");
      } else {
        appendMessage(
          "assistant",
          "No problem. You can explore the portfolio or contact Muhammed whenever you like.",
        );
        setStep("chat");
      }
    }
  };

  const sendLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (String(formData.get("website") ?? "").trim()) return;

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const note = String(formData.get("message") ?? "").trim();
    const summary = discoveryIntent
      ? discoverySummaries[discoveryIntent]
      : "A visitor would like Muhammed to follow up.";
    const body = [
      summary,
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      note ? `Message: ${note}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT;

    setFormStatus("");
    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("FORM_SUBMISSION_FAILED");
        setFormStatus("Thanks! Your message has been sent to Muhammed.");
        appendMessage(
          "assistant",
          "Thanks! Your message has been sent to Muhammed.",
        );
        setStep("chat");
        return;
      } catch {
        setFormStatus(
          "We couldn't send your message. Please try again or email Muhammed directly.",
        );
        return;
      }
    }

    const mailto = `mailto:${assistantKnowledge.contact.email}?subject=${encodeURIComponent("Portfolio assistant follow-up")}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setFormStatus("Your email app is opening with the follow-up details.");
    setStep("chat");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const currentQuestion =
    step === "intent" ||
    step === "hire-role" ||
    step === "project-goal" ||
    step === "explore-topic" ||
    step === "consent"
      ? assistantDiscovery.steps[step]
      : null;

  return (
    <div className="assistant-backdrop" onMouseDown={onClose}>
      <section
        aria-label="Muhammed's AI assistant"
        aria-modal="true"
        className="assistant-panel"
        onKeyDown={handleKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <header className="assistant-header">
          <div>
            <div className="assistant-header__title">
              <AssistantIcon blinkOnMount size={24} state={eyeState} />
              <h2>Muhammed's AI assistant</h2>
            </div>
            <p>AI assistant, may make mistakes.</p>
          </div>
          <button
            aria-label="Close assistant"
            className="assistant-close"
            onClick={onClose}
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
        </header>

        <div
          aria-live="polite"
          aria-relevant="additions text"
          className="assistant-messages"
          ref={listRef}
          role="log"
        >
          {messages.map((message) => (
            <MessageBubble
              isWaiting={isLoading && message.content === ""}
              key={message.id}
              message={message}
            />
          ))}
          {messages.length === 0 && step === "chat" && (
            <div className="assistant-welcome">
              <p>
                Ask about Muhammed's skills, projects, availability, or how to
                get in touch.
              </p>
              <div className="assistant-suggestions">
                {assistantKnowledge.faq.slice(9, 12).map((entry) => (
                  <button
                    key={entry.questions[0]}
                    onClick={() => void submit(entry.questions[0])}
                    type="button"
                  >
                    {entry.questions[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {currentQuestion && (
            <div className="assistant-message assistant-message--assistant">
              {step === "intent" && (
                <p className="assistant-discovery-intro">
                  {assistantDiscovery.greeting}
                </p>
              )}
              <p>{currentQuestion.question}</p>
              <div className="assistant-suggestions">
                {currentQuestion.choices.map((choice) => (
                  <button
                    key={choice.value}
                    disabled={isLoading}
                    onClick={() => choose(choice.value, choice.label)}
                    type="button"
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1]?.content !== "" && (
              <div className="assistant-message assistant-message--assistant">
                <TypingIndicator />
              </div>
            )}
          {faqAction && (
            <a
              className="assistant-action-chip"
              href={faqAction.href}
              onClick={onClose}
            >
              {faqAction.label}
            </a>
          )}
          {step === "lead-form" && (
            <form className="assistant-lead-form" onSubmit={sendLead}>
              <div className="assistant-honeypot" aria-hidden="true">
                <label htmlFor="assistant-website">
                  Leave this field empty
                </label>
                <input
                  autoComplete="off"
                  id="assistant-website"
                  name="website"
                  tabIndex={-1}
                />
              </div>
              <label htmlFor="assistant-lead-name">Name</label>
              <input
                autoComplete="name"
                id="assistant-lead-name"
                maxLength={100}
                name="name"
                required
              />
              <label htmlFor="assistant-lead-email">Email</label>
              <input
                autoComplete="email"
                id="assistant-lead-email"
                maxLength={254}
                name="email"
                required
                type="email"
              />
              <label htmlFor="assistant-lead-message">Optional message</label>
              <textarea
                id="assistant-lead-message"
                maxLength={1000}
                name="message"
                rows={3}
              />
              <p>{assistantDiscovery.contactConsent}</p>
              <button type="submit">Send to Muhammed</button>
            </form>
          )}
          {formStatus && (
            <p
              aria-live="polite"
              className="assistant-form-status"
              role="status"
            >
              {formStatus}
            </p>
          )}
          {error && (
            <p className="assistant-error" role="alert">
              {error}{" "}
              <a href="#contact" onClick={onClose}>
                Contact Muhammed
              </a>
              .
            </p>
          )}
        </div>

        <form className="assistant-form" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="assistant-question">
            Ask a question about Muhammed
          </label>
          <input
            autoComplete="off"
            id="assistant-question"
            maxLength={500}
            onChange={(event) => {
              setInput(event.target.value);
              if (error) clearError();
            }}
            placeholder={
              step === "collaboration-detail"
                ? "Tell Muhammed what you have in mind…"
                : "Ask about Muhammed…"
            }
            ref={inputRef}
            value={input}
          />
          <button
            aria-label="Send message"
            disabled={isLoading || input.trim().length === 0}
            type="submit"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12h15m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </form>
        <p className="assistant-privacy">
          Please don't share personal or sensitive information.
        </p>
      </section>
    </div>
  );
}
