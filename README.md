# Muhammed K Ceesay — Portfolio

A responsive, accessible portfolio built with Vite, React, TypeScript, and Tailwind CSS. Real public project links and editable project details live in `src/data/projects.ts`.

## Requirements

- Node.js 22 or later
- npm

## Run locally

```bash
npm ci
npm run dev
```

Vite prints a local URL when the development server is ready.

## Contact form setup

The form uses [Formspree](https://formspree.io/) to send messages from this static site:

1. Create and verify a Formspree account, then create a form and confirm its recipient email.
2. Copy `.env.example` to `.env.local` and set `VITE_FORMSPREE_ENDPOINT` to the endpoint Formspree gives you.
3. Restart the local dev server to test the form.

The endpoint is public client-side configuration, not a secret. Configure spam protections and allowed domains in Formspree. If the form is not configured or delivery fails, the page directs visitors to the published email address. The form disables browser-default validation tooltips and displays accessible inline field errors instead.

For GitHub Pages, add a repository variable named `VITE_FORMSPREE_ENDPOINT` under **Settings → Secrets and variables → Actions → Variables**, set it to your Formspree form endpoint, then rerun the Pages deployment workflow. Do not commit credentials or personal account information to the repository.

## Edit portfolio content

- Projects, case-study text, and repository/live links: `src/data/projects.ts`
- Skills: `src/components/Sections.tsx`
- Portrait and project images: `public/assets/`
- Design tokens and responsive styles: `src/index.css`

The project cards use screenshots from the live AI Task Assistant and Dalasi Tip Splitter, plus the supplied UTG Digital Student Services screenshot. No project image is published for To-do List, so that card intentionally displays a neutral no-image notice instead of invented artwork. The UTG student clearance entry is a prototype, not an official University of The Gambia service. Live demo links are only shown for projects with a published demo; add a `liveUrl` in `src/data/projects.ts` when another project is deployed.

## Check and build

```bash
npm run lint
npm run format:check
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push changes to `main`.
2. In repository **Settings → Pages**, select **GitHub Actions** as the build and deployment source.
3. The workflow at `.github/workflows/deploy.yml` builds the Vite site and deploys `dist` on each push to `main`.
4. The Vite base path is configured for this repository at `/single-profile-09/`. If the repository is renamed, update `base` in `vite.config.ts` and the canonical, Open Graph, and sitemap URLs in `index.html` and `public/sitemap.xml`.

The Formspree endpoint is public client-side configuration; configure spam controls and allowed domains in Formspree as appropriate.
