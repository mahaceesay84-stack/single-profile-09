import { assistantKnowledge } from "./assistant-knowledge";

export type DiscoveryIntent = "hire" | "project" | "explore" | "collaboration";

export type DiscoveryStep =
  | "intent"
  | "hire-role"
  | "project-goal"
  | "explore-topic"
  | "collaboration-detail"
  | "consent"
  | "lead-form"
  | "chat";

export const intentFollowUpSteps: Record<
  Exclude<DiscoveryIntent, "collaboration">,
  Extract<DiscoveryStep, "hire-role" | "project-goal" | "explore-topic">
> = {
  hire: "hire-role",
  project: "project-goal",
  explore: "explore-topic",
};

export type DiscoveryChoice = {
  label: string;
  value: string;
};

export const assistantDiscovery = {
  greeting: "Hi! I can help you learn about Muhammed's work.",
  maxQuestions: 3,
  steps: {
    intent: {
      question: "What brings you here today?",
      choices: [
        { label: "Hiring for a role", value: "hire" },
        { label: "I have a project in mind", value: "project" },
        { label: "Just exploring", value: "explore" },
        { label: "Collaboration or partnership", value: "collaboration" },
      ],
    },
    "hire-role": {
      question: "What kind of role?",
      choices: [
        { label: "Full-stack", value: "Full-stack" },
        { label: "AI / agents", value: "AI / agents" },
        { label: "Frontend", value: "Frontend" },
        { label: "Other", value: "Other" },
      ],
    },
    "project-goal": {
      question: "What do you want to build?",
      choices: [
        { label: "Web app", value: "Web app" },
        { label: "AI assistant or agent", value: "AI assistant or agent" },
        { label: "Mobile or WhatsApp bot", value: "Mobile or WhatsApp bot" },
        { label: "Not sure yet", value: "Not sure yet" },
      ],
    },
    "explore-topic": {
      question: "Want a quick tour?",
      choices: [
        { label: "Skills", value: "Skills" },
        { label: "Projects", value: "Projects" },
        { label: "Availability", value: "Availability" },
      ],
    },
    consent: {
      question: "Would you like Muhammed to follow up?",
      choices: [
        { label: "Yes, contact me", value: "yes" },
        { label: "No thanks", value: "no" },
      ],
    },
  },
  collaborationQuestion: "What do you have in mind?",
  contactConsent: "Your details are sent only to Muhammed to reply to you.",
} as const satisfies {
  greeting: string;
  steps: Record<
    "intent" | "hire-role" | "project-goal" | "explore-topic" | "consent",
    { question: string; choices: readonly DiscoveryChoice[] }
  >;
  maxQuestions: number;
  collaborationQuestion: string;
  contactConsent: string;
};

const listedSkills = [
  ...assistantKnowledge.skills.frontend.slice(0, 3),
  ...assistantKnowledge.skills.backend.slice(0, 2),
  assistantKnowledge.skills.aiAndAgents[0],
].join(", ");
const sentenceCaseService = (value: string) =>
  `${value.charAt(0).toLowerCase()}${value.slice(1)}`;

export const discoverySummaries: Record<DiscoveryIntent, string> = {
  hire: `${assistantKnowledge.availability} His work includes ${sentenceCaseService(assistantKnowledge.services[0])} and ${sentenceCaseService(assistantKnowledge.services[2])}.`,
  project: `Muhammed's listed services include ${sentenceCaseService(assistantKnowledge.services[0])} and ${sentenceCaseService(assistantKnowledge.services[2])}.`,
  explore: `${assistantKnowledge.bio} His listed skills include ${listedSkills}.`,
  collaboration: `${assistantKnowledge.lookingFor} His work includes ${sentenceCaseService(assistantKnowledge.services[0])} and ${sentenceCaseService(assistantKnowledge.services[2])}.`,
};
