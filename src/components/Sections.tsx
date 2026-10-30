import {
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { projects, type Project } from "../data/projects";

const emailAddress = "muhammedkceesay42@gmail.com";
const githubUrl = "https://github.com/mahaceesay84-stack";
const navItems = [
  ["home", "Home"],
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["about", "About"],
  ["contact", "Contact"],
] as const;

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18">
      <path
        d="M3 9h11M9 3l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Header() {
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightTheme, setLightTheme] = useState(
    () => localStorage.getItem("portfolio-theme") === "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = lightTheme ? "light" : "dark";
    localStorage.setItem("portfolio-theme", lightTheme ? "light" : "dark");
  }, [lightTheme]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.25, 0.5] },
    );
    navItems.forEach(([id]) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <header className="site-header">
      <a className="wordmark" href="#home" aria-label="Muhammed K Ceesay, home">
        MKC<span>.</span>
      </a>
      <button
        className={menuOpen ? "menu-toggle is-open" : "menu-toggle"}
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
        <span />
        <span />
      </button>
      <nav
        aria-label="Main navigation"
        id="primary-navigation"
        className={menuOpen ? "navigation is-open" : "navigation"}
      >
        {navItems.map(([id, label]) => (
          <a
            href={`#${id}`}
            key={id}
            aria-current={activeSection === id ? "location" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </a>
        ))}
        <button
          className="theme-toggle"
          type="button"
          aria-label={`Switch to ${lightTheme ? "dark" : "light"} theme`}
          onClick={() => setLightTheme((theme) => !theme)}
        >
          <span aria-hidden="true">{lightTheme ? "☾" : "☼"}</span>
        </button>
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <section
      className="hero section-shell"
      id="home"
      aria-labelledby="hero-title"
    >
      <div className="hero-copy reveal">
        <p className="eyebrow">
          <span className="availability-dot" /> Open to opportunities
        </p>
        <p className="kicker">FULL-STACK SOFTWARE ENGINEER · THE GAMBIA</p>
        <h1 id="hero-title">
          Full-stack engineer building <span>agentic AI systems</span> and web
          apps.
        </h1>
        <p className="hero-intro">
          I turn ambitious ideas into useful digital experiences with thoughtful
          engineering, practical AI, and a focus on the people using them.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#projects">
            View my work <ArrowIcon />
          </a>
          <a className="button button-quiet" href="#contact">
            Contact me <ArrowIcon />
          </a>
        </div>
        <div className="social-links" aria-label="Social links">
          <a href={githubUrl} target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <a href={`mailto:${emailAddress}`}>
            Email <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="hero-visual reveal">
        <div className="portrait-frame">
          <img
            className="portrait"
            src={`${import.meta.env.BASE_URL}assets/profile-cutout.png`}
            alt="Muhammed K Ceesay"
            width="907"
            height="1079"
            fetchPriority="high"
          />
          <span className="portrait-caption">BUILDING FROM THE GAMBIA</span>
        </div>
        <img
          className="hero-rings"
          src={`${import.meta.env.BASE_URL}assets/pattern-rings.svg`}
          alt=""
          aria-hidden="true"
        />
        <img
          className="hero-circle"
          src={`${import.meta.env.BASE_URL}assets/pattern-circle.svg`}
          alt=""
          aria-hidden="true"
        />
        <span className="hero-coordinate" aria-hidden="true">
          13°27′ N<br />
          16°34′ W
        </span>
      </div>
      <a className="scroll-cue" href="#skills">
        <span /> SCROLL TO EXPLORE
      </a>
    </section>
  );
}

const skillGroups = [
  {
    name: "Frontend",
    note: "Interfaces built for people",
    skills: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "HTML",
      "CSS",
    ],
  },
  {
    name: "Backend",
    note: "Reliable application foundations",
    skills: ["Python", "Node.js", "REST APIs"],
  },
  {
    name: "AI / Agents",
    note: "Practical, tool-using systems",
    skills: ["Agentic AI", "LLM integration", "Prompt design"],
  },
  {
    name: "Tools",
    note: "From first commit to release",
    skills: ["Git", "GitHub", "Vite", "Responsive design"],
  },
];

export function Skills() {
  return (
    <section
      className="skills section-shell"
      id="skills"
      aria-labelledby="skills-title"
    >
      <div className="section-heading reveal">
        <p className="kicker">WHAT I WORK WITH</p>
        <h2 id="skills-title">
          Tools for thoughtful <span>building.</span>
        </h2>
        <p>
          A versatile toolkit for shaping an idea into a polished, working
          product.
        </p>
      </div>
      <div className="skill-grid">
        {skillGroups.map((group, index) => (
          <article
            className="skill-card reveal"
            key={group.name}
            style={{ "--delay": `${index * 70}ms` } as CSSProperties}
          >
            <span className="skill-index">0{index + 1}</span>
            <h3>{group.name}</h3>
            <p>{group.note}</p>
            <ul>
              {group.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = bodyOverflow;
      previouslyFocused.current?.focus();
    };
  }, []);

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") onClose();
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      ),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby="project-modal-title"
        aria-modal="true"
        className="project-modal"
        onKeyDown={trapFocus}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <button
          className="modal-close"
          onClick={onClose}
          ref={closeRef}
          type="button"
          aria-label="Close project details"
        >
          ×
        </button>
        {project.image && (
          <img
            className={`modal-image${project.imageFit === "contain" ? " image-contain" : ""}`}
            src={`${import.meta.env.BASE_URL}assets/${project.image}`}
            alt={project.alt ?? ""}
            width={project.imageFit === "contain" ? "540" : "1440"}
            height={project.imageFit === "contain" ? "540" : "960"}
          />
        )}
        <p className="kicker">PROJECT DETAILS · GITHUB REPOSITORY</p>
        <h2 id="project-modal-title">{project.title}</h2>
        <p className="modal-summary">{project.summary}</p>
        <div className="modal-details">
          <div>
            <h3>Problem</h3>
            <p>{project.problem}</p>
          </div>
          <div>
            <h3>Role</h3>
            <p>{project.role}</p>
          </div>
          <div>
            <h3>Stack</h3>
            <p>{project.stack.join(" · ")}</p>
          </div>
          <div>
            <h3>Outcome</h3>
            <p>{project.result}</p>
          </div>
        </div>
        <a
          className="text-link"
          href={project.codeUrl}
          target="_blank"
          rel="noreferrer"
        >
          View source on GitHub <ArrowIcon />
        </a>
      </div>
    </div>
  );
}

export function Projects() {
  const [filter, setFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const tags = [
    "All",
    ...new Set(projects.flatMap((project) => project.stack)),
  ];
  const filteredProjects =
    filter === "All"
      ? projects
      : projects.filter((project) => project.stack.includes(filter));

  return (
    <section
      className="projects section-shell"
      id="projects"
      aria-labelledby="projects-title"
    >
      <div className="section-heading section-heading-row reveal">
        <div>
          <p className="kicker">SELECTED WORK</p>
          <h2 id="projects-title">
            Useful ideas, <span>shipped.</span>
          </h2>
          <p>
            A selection of real projects, from AI-assisted task planning to
            everyday tools built for Gambian users.
          </p>
        </div>
        <a className="button button-quiet" href="#contact">
          Start a conversation <ArrowIcon />
        </a>
      </div>
      <div
        className="project-filters"
        aria-label="Filter projects by technology"
      >
        {tags.map((tag) => (
          <button
            aria-pressed={filter === tag}
            className={
              filter === tag ? "filter-chip is-selected" : "filter-chip"
            }
            key={tag}
            onClick={() => setFilter(tag)}
            type="button"
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="project-grid" aria-live="polite">
        {filteredProjects.map((project, index) => (
          <article
            className="project-card reveal"
            key={project.id}
            style={{ "--delay": `${index * 60}ms` } as CSSProperties}
          >
            <button
              className="project-preview"
              onClick={() => setSelectedProject(project)}
              type="button"
              aria-label={`View ${project.title} case study`}
            >
              {project.image ? (
                <img
                  className={
                    project.imageFit === "contain" ? "image-contain" : undefined
                  }
                  src={`${import.meta.env.BASE_URL}assets/${project.image}`}
                  alt={project.alt ?? ""}
                  width={project.imageFit === "contain" ? "540" : "1440"}
                  height={project.imageFit === "contain" ? "540" : "960"}
                  loading="lazy"
                />
              ) : (
                <span className="project-image-missing">
                  No original project image published
                </span>
              )}
              <span className="preview-action">
                View case study <ArrowIcon />
              </span>
            </button>
            <div className="project-info">
              <div>
                <p className="project-number">PROJECT 0{project.id}</p>
                <h3>{project.title}</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedProject(project)}
                type="button"
                aria-label={`Open ${project.title} case study`}
              >
                <ArrowIcon />
              </button>
            </div>
            <p className="project-summary">{project.summary}</p>
            <ul
              className="project-tags"
              aria-label={`${project.title} technologies`}
            >
              {project.stack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="project-links">
              {project.liveUrl ? (
                <a href={project.liveUrl} target="_blank" rel="noreferrer">
                  Live <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <span className="unavailable-link">Live demo unavailable</span>
              )}
              <a href={project.codeUrl} target="_blank" rel="noreferrer">
                Code <span aria-hidden="true">↗</span>
              </a>
              <button onClick={() => setSelectedProject(project)} type="button">
                Case study <ArrowIcon />
              </button>
            </div>
          </article>
        ))}
      </div>
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
}

export function About() {
  return (
    <section
      className="about section-shell"
      id="about"
      aria-labelledby="about-title"
    >
      <div className="about-mark reveal" aria-hidden="true">
        <span>MK</span>
        <img
          src={`${import.meta.env.BASE_URL}assets/pattern-circle.svg`}
          alt=""
        />
      </div>
      <div className="about-copy reveal">
        <p className="kicker">A LITTLE ABOUT ME</p>
        <h2 id="about-title">
          Curiosity, craft, and <span>good software.</span>
        </h2>
        <p>
          I’m Muhammed K Ceesay, a full-stack software engineer based in The
          Gambia. I enjoy working across the stack—from designing clear,
          accessible interfaces to building backend services and exploring
          agentic AI systems that solve practical problems.
        </p>
        <p>
          I’m looking for opportunities to collaborate with thoughtful teams,
          keep growing as an engineer, and build useful products with care.
        </p>
        <a className="text-link" href="#contact">
          Let’s build something useful <ArrowIcon />
        </a>
      </div>
    </section>
  );
}

export function Contact() {
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "email" | "message", string>>
  >({});

  function validateField(
    field: "name" | "email" | "message",
    value: string,
  ): string {
    const trimmed = value.trim();
    if (!trimmed) {
      if (field === "name") return "Please enter your name.";
      if (field === "email") return "Please enter your email address.";
      return "Please enter a message.";
    }

    if (field === "name" && trimmed.length < 2) {
      return "Please enter at least 2 characters.";
    }
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      return "Enter a valid email address, such as name@example.com.";
    }
    if (field === "message" && trimmed.length < 10) {
      return "Please enter at least 10 characters so I have enough context.";
    }
    return "";
  }

  function handleFieldBlur(
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const field = event.currentTarget.name as "name" | "email" | "message";
    const value = event.currentTarget.value;
    setFieldErrors((current) => ({
      ...current,
      [field]: validateField(field, value),
    }));
  }

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const field = event.currentTarget.name as "name" | "email" | "message";
    const value = event.currentTarget.value;
    setStatus(null);
    setFieldErrors((current) => {
      if (!(field in current)) return current;
      return { ...current, [field]: validateField(field, value) };
    });
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    };
    const errors = {
      name: validateField("name", values.name),
      email: validateField("email", values.email),
      message: validateField("message", values.message),
    };
    setFieldErrors(errors);
    const firstInvalidField = (
      Object.keys(errors) as Array<keyof typeof errors>
    ).find((field) => errors[field]);
    if (firstInvalidField) {
      document.getElementById(`contact-${firstInvalidField}`)?.focus();
      return;
    }

    data.set("name", values.name.trim());
    data.set("email", values.email.trim());
    data.set("message", values.message.trim());

    if (data.get("website")) {
      setStatus({ kind: "success", message: "Thanks for your message." });
      form.reset();
      return;
    }
    const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT;
    if (!endpoint) {
      setStatus({
        kind: "error",
        message:
          "The contact form is not configured yet. Please email me directly at muhammedkceesay42@gmail.com.",
      });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error("The contact service returned an error.");
      form.reset();
      setFieldErrors({});
      setStatus({
        kind: "success",
        message: "Thanks for reaching out. Your message has been sent.",
      });
    } catch {
      setStatus({
        kind: "error",
        message:
          "Your message could not be sent. Please try again or email me directly.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="contact section-shell"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="contact-copy reveal">
        <p className="kicker">HAVE A GOOD ONE IN MIND?</p>
        <h2 id="contact-title">
          Let’s make it <span>real.</span>
        </h2>
        <p>
          Have an opportunity, a project, or an interesting idea? I’d love to
          hear what you’re working on.
        </p>
        <a className="contact-email" href={`mailto:${emailAddress}`}>
          {emailAddress} <span aria-hidden="true">↗</span>
        </a>
        <img
          className="contact-rings"
          src={`${import.meta.env.BASE_URL}assets/pattern-rings.svg`}
          alt=""
          aria-hidden="true"
        />
      </div>
      <form className="contact-form reveal" onSubmit={submitForm} noValidate>
        <label htmlFor="contact-name">Your name</label>
        <input
          id="contact-name"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
          onBlur={handleFieldBlur}
          onChange={handleFieldChange}
        />
        {fieldErrors.name && (
          <p className="field-error" id="contact-name-error" role="alert">
            {fieldErrors.name}
          </p>
        )}
        <label htmlFor="contact-email">Email address</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email ? "contact-email-error" : undefined
          }
          onBlur={handleFieldBlur}
          onChange={handleFieldChange}
        />
        {fieldErrors.email && (
          <p className="field-error" id="contact-email-error" role="alert">
            {fieldErrors.email}
          </p>
        )}
        <label htmlFor="contact-message">Your message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          required
          maxLength={5000}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={
            fieldErrors.message ? "contact-message-error" : undefined
          }
          onBlur={handleFieldBlur}
          onChange={handleFieldChange}
        />
        {fieldErrors.message && (
          <p className="field-error" id="contact-message-error" role="alert">
            {fieldErrors.message}
          </p>
        )}
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="contact-website">Leave this field empty</label>
          <input
            id="contact-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <button
          className="button button-primary"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Sending…" : "Send message"} <ArrowIcon />
        </button>
        <p className="form-note">
          Your details are only used to reply to your message.
        </p>
        <p
          aria-live="polite"
          className={`form-status${status ? ` ${status.kind}` : ""}`}
          role={status?.kind === "error" ? "alert" : "status"}
        >
          {status?.message ?? ""}
        </p>
      </form>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer section-shell">
      <a className="wordmark" href="#home">
        MKC<span>.</span>
      </a>
      <p>Designed and built with care by Muhammed K Ceesay.</p>
      <div className="footer-links">
        <a href={githubUrl} target="_blank" rel="noreferrer">
          GitHub <span aria-hidden="true">↗</span>
        </a>
        <a href={`mailto:${emailAddress}`}>
          Email <span aria-hidden="true">↗</span>
        </a>
      </div>
      <p className="copyright">
        © {new Date().getFullYear()} Muhammed K Ceesay
      </p>
    </footer>
  );
}
