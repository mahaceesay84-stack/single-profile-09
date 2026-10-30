export type Project = {
  id: number;
  title: string;
  summary: string;
  image?: string;
  alt?: string;
  imageFit?: "cover" | "contain";
  stack: string[];
  problem: string;
  role: string;
  result: string;
  codeUrl: string;
  liveUrl?: string;
};

const github = "https://github.com/mahaceesay84-stack";

export const projects: Project[] = [
  {
    id: 1,
    title: "AI Task Assistant",
    summary:
      "An AI-powered task manager that breaks work into steps, prioritizes deadlines, and summarizes progress.",
    image: "projects/ai-task-assistant.png",
    alt: "Screenshot of the live AI Task Assistant application",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "AI agents"],
    problem:
      "Turning a large task list into clear next actions and priorities can take time.",
    role: "Built with task CRUD, localStorage persistence, AI route handlers, agent logic, and deterministic fallbacks.",
    result:
      "Breaks down tasks, prioritizes open work, and summarizes progress; heuristic fallbacks keep AI features usable without a model key.",
    codeUrl: `${github}/ai-task-assistant`,
    liveUrl: "https://ai-task-assistant-sigma.vercel.app",
  },
  {
    id: 2,
    title: "UTG Student Clearance",
    summary:
      "A student-clearance workflow prototype for document submissions and staff review.",
    image: "projects/utg-clearance.jpg",
    alt: "UTG Digital Student Services clearance screen showing student approval status",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Python", "Django REST"],
    problem:
      "Students need a clear way to submit clearance requirements and follow their application status.",
    role: "Full-stack prototype with a Next.js frontend and Django REST API using JWT authentication.",
    result:
      "Supports staff review decisions and a mock mobile-money fee flow. This is a prototype, not an official University of The Gambia service.",
    codeUrl: `${github}/Gam-tin`,
  },
  {
    id: 3,
    title: "Dalasi Tip Splitter",
    summary:
      "A Gambian dalasi bill splitter with quick tip presets, custom tips, and per-person totals.",
    image: "projects/tip-splitter.png",
    alt: "Screenshot of the live Dalasi Tip Splitter application",
    stack: ["HTML", "CSS", "JavaScript"],
    problem:
      "Splitting a bill fairly means keeping the tip, total, and individual shares easy to understand.",
    role: "Built a responsive calculator with live input updates, validation, and remainder handling.",
    result:
      "Uses integer math in bututs to avoid floating-point rounding in dalasi calculations and handles uneven splits.",
    codeUrl: `${github}/tip-splitter`,
    liveUrl: "https://mahaceesay84-stack.github.io/tip-splitter/",
  },
  {
    id: 4,
    title: "To-do List",
    summary:
      "A responsive task-list app built to keep everyday tasks easy to scan and manage.",
    image: "projects/todo-list.jpg",
    alt: "Screenshot of the To-do List app showing tasks, due dates, and completion controls",
    stack: ["JavaScript", "Tailwind CSS", "Vite"],
    problem:
      "A lightweight to-do list should make everyday tasks straightforward to keep track of.",
    role: "Built a responsive task-list application with JavaScript and Tailwind CSS.",
    result: "A clean, mobile-friendly way to organize day-to-day tasks.",
    codeUrl: `${github}/my-todo-app-website.com`,
  },
];
