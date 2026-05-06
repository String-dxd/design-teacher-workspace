# MOE Teacher Workspace

A design prototype for the **MOE (Ministry of Education) Teacher Workspace** — a centralised hub for school management, student insights, and daily teacher tools. The application includes modules for announcements, forms, reports, student management, groups, student analytics, and an AI insight assistant.

> **Note:** This project uses mock data and is intended as a design/UX prototype — there is no live backend.

## Tech Stack

| Layer           | Technology                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Framework       | [TanStack Start](https://tanstack.com/start) (full-stack React with SSR)                                      |
| Language        | TypeScript                                                                                                    |
| UI Components   | [Shadcn UI](https://ui.shadcn.com/) with [Base UI (MUI)](https://base-ui.com/) primitives (`base-maia` style) |
| Styling         | Tailwind CSS v4 with CSS variables                                                                            |
| Routing         | TanStack Router (file-based)                                                                                  |
| Rich Text       | Tiptap                                                                                                        |
| Charts          | Recharts                                                                                                      |
| Icons           | Lucide React                                                                                                  |
| Design Tokens   | Flow Design System (`@flow/core`, `@flow/design-tokens`)                                                      |
| Build Tool      | Vite                                                                                                          |
| Package Manager | Bun                                                                                                           |
| Testing         | Vitest + Testing Library (React & DOM)                                                                        |
| Linting         | ESLint (TanStack config)                                                                                      |
| Formatting      | Prettier                                                                                                      |

## Project Structure

```
├── apps/                  # Workspace apps (e.g. flow-ds-test)
├── packages/              # Shared packages (e.g. ds-tw-skills)
├── public/                # Static assets (images, favicon, manifest)
├── src/
│   ├── components/        # React components
│   │   ├── ui/            # Shadcn UI primitives (Button, Input, Table, etc.)
│   │   ├── comms/         # Shared communication components (selectors, editors)
│   │   ├── forms/         # Form-specific components
│   │   └── ...            # App-level components (sidebar, header, cards)
│   ├── data/              # Mock data for all modules
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities, auth, and feature flags
│   ├── routes/            # File-based route definitions
│   └── types/             # TypeScript type definitions
├── todos/                 # Project task tracking
├── components.json        # Shadcn UI configuration
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

## Prerequisites

- **[Bun](https://bun.sh/)** (runtime & package manager) — the project uses `bunfig.toml` to run all scripts with Bun's native runtime.
- **Node.js ≥ 18** (required by some tooling)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/String-sg/design-teacher-workspace.git
   cd design-teacher-workspace
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

   > The `.npmrc` configures a scoped registry for `@flow/*` packages. No additional auth tokens are needed for public access.

3. **Copy the environment file** (optional — no environment variables are required; feature flags are stored in `localStorage`)

   ```bash
   cp .env.example .env
   ```

4. **Start the development server**

   ```bash
   bun run dev
   ```

   The app will be available at **http://127.0.0.1:3000**.

## Available Scripts

| Command           | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `bun run dev`     | Start the Vite dev server on port 3000                                     |
| `bun run build`   | Create a production build                                                  |
| `bun run preview` | Preview the production build locally                                       |
| `bun run test`    | Run tests with Vitest                                                      |
| `bun run lint`    | Run ESLint                                                                 |
| `bun run format`  | Run Prettier                                                               |
| `bun run check`   | Auto-fix formatting and lint issues (`prettier --write . && eslint --fix`) |

## Dependencies

### Runtime

- **@tanstack/react-start** — Full-stack React framework with SSR
- **@tanstack/react-router** — File-based routing
- **@base-ui/react** — Headless UI primitives from MUI
- **@flow/core & @flow/design-tokens** — MOE Flow Design System
- **@tiptap** extensions — Rich text editor suite
- **recharts** — Charting library
- **tailwindcss** — Utility-first CSS framework
- **lucide-react** — Icon library
- **date-fns** — Date utility library
- **sonner** — Toast notifications
- **class-variance-authority / clsx / tailwind-merge** — ClassName utilities

### Development

- **vite** — Build tool and dev server
- **vitest** — Test runner
- **@testing-library/react & @testing-library/dom** — Component testing utilities
- **jsdom** — DOM environment for tests
- **typescript** — Type checking
- **prettier** — Code formatting
- **shadcn** — CLI to scaffold new UI components

## Tests

The project is configured with **Vitest** and **Testing Library** for component and unit testing. Run the test suite with:

```bash
bun run test
```

There are currently no test files in the repository. When adding tests, place them alongside the source files using the `*.test.ts` or `*.test.tsx` naming convention. Vitest is configured in `vite.config.ts`.

## Adding Shadcn UI Components

New Shadcn components can be scaffolded with:

```bash
bunx shadcn@latest add <component-name>
```

Components are generated into `src/components/ui/` and use Base UI primitives (not Radix). See `components.json` for configuration details.

## Path Aliases

The project uses `@/*` to map to `src/*`:

```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```
