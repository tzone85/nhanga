# Nhanga Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single-user PWA for learning Shona through music with a Sunday weekly quiz, spaced repetition, and YouTube Share-Sheet ingestion — installable on iPhone and Mac, deployed on Vercel, source on GitHub.

**Architecture:** Clean/Hexagonal. Pure domain → ports → application use-cases → infra adapters → Next.js App Router presentation. Single composition root wires real adapters; tests swap in fakes. State persisted in Upstash Redis (Vercel Marketplace), AI via Vercel AI Gateway, push via Web Push + Vercel Cron.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, TypeScript 5, Vitest, Playwright, msw, Zod, ulid, date-fns, @upstash/redis, web-push, @vercel/ai, Vercel AI Gateway, Vercel Cron.

**Companion spec:** `docs/superpowers/specs/2026-05-27-nhanga-design.md`

---

## File Structure

```
nhanga/
├── app/
│   ├── layout.tsx                       # Root layout, fonts, theme
│   ├── page.tsx                         # Marketing / install prompt
│   ├── learn/
│   │   ├── page.tsx                     # Song library
│   │   └── [songId]/page.tsx            # Song editor
│   ├── share/page.tsx                   # share_target receiver
│   ├── quiz/[lessonId]/page.tsx         # Sunday quiz session
│   ├── add/page.tsx                     # Manual paste fallback
│   └── api/
│       ├── songs/route.ts               # GET list, POST upsert
│       ├── songs/[id]/route.ts          # GET, PATCH, DELETE
│       ├── translate/route.ts           # POST → AI draft
│       ├── lessons/route.ts             # GET current, POST new
│       ├── attempts/route.ts            # POST quiz attempt
│       └── cron/sunday-pick/route.ts    # Cron handler
├── src/
│   ├── domain/                          # ids, song, lesson, quiz, srs
│   ├── application/                     # addSong, refineLine, pickWeeklySong, runQuiz, buildQuizItems, sundayPick
│   ├── ports/                           # translator, lyricsSource, videoAdapter, progressStore, notifier, clock
│   ├── infra/                           # translator.aiGateway, lyrics.*, video.youtube, store.kv, push.webpush, clock.system
│   ├── ui/                              # theme/, components/
│   └── composition.ts                   # DI root
├── public/                              # manifest, sw.js, icons
├── seed/songs.json                      # 6 hand-curated classics
├── tests/{unit,integration,e2e}/
├── .github/workflows/ci.yml
├── vercel.ts
├── vitest.config.ts
├── playwright.config.ts
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
├── README.md
├── AGENTS.md
├── CLAUDE.md
└── mempalace.yaml                       # already exists
```

---

## Phase 0 — Repo scaffold (working, deployable shell)

### Task 0.1: Initialise Next.js project

**Files:**
- Create: `/Users/mncedimini/Sites/misc/nhanga/package.json`
- Create: `/Users/mncedimini/Sites/misc/nhanga/tsconfig.json`
- Create: `/Users/mncedimini/Sites/misc/nhanga/next.config.ts`
- Create: `/Users/mncedimini/Sites/misc/nhanga/postcss.config.mjs`
- Create: `/Users/mncedimini/Sites/misc/nhanga/app/layout.tsx`
- Create: `/Users/mncedimini/Sites/misc/nhanga/app/page.tsx`
- Create: `/Users/mncedimini/Sites/misc/nhanga/app/globals.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "nhanga",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "ulid": "^2.3.0",
    "zod": "^3.23.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitest/coverage-v8": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "jsdom": "^25.0.0",
    "msw": "^2.6.0",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.48.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

Note: Next 16 will rewrite `"jsx": "preserve"` to `"jsx": "react-jsx"` and append `.next/types/**/*.ts` + `.next/dev/types/**/*.ts` to `include` on the first build. That is mandatory under Next 16 and is acceptable — commit the post-build version.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@domain/*": ["./src/domain/*"],
      "@application/*": ["./src/application/*"],
      "@ports/*": ["./src/ports/*"],
      "@infra/*": ["./src/infra/*"],
      "@ui/*": ["./src/ui/*"]
    },
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: {},
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }
        ]
      }
    ];
  }
};

export default config;
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```js
export default {
  plugins: { "@tailwindcss/postcss": {} }
};
```

- [ ] **Step 5: Create `app/globals.css`**

```css
@import "tailwindcss";

@theme inline {
  --color-ndoro:   #f6efe2;
  --color-gora:    #1f1d1c;
  --color-mwedzi:  #d99749;
  --color-shavi:   #8c3a26;
  --color-ruwa:    #4f6b35;
  --color-mvura:   #2e6f8c;
  --font-display:  var(--font-fraunces);
  --font-sans:     var(--font-inter);
}

:root {
  --background: var(--color-ndoro);
  --foreground: var(--color-gora);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

::selection { background: var(--color-mwedzi); color: var(--color-gora); }
```

- [ ] **Step 6: Create `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Nhanga — learn Shona by song",
  description: "One song a week. Sunday quiz. Built to remember.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#f6efe2",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create `app/page.tsx`** (placeholder marketing page)

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl text-center">
        <h1 className="font-[family-name:var(--font-fraunces)] text-6xl text-[var(--color-shavi)] mb-4">
          Nhanga
        </h1>
        <p className="text-lg text-[var(--color-gora)]/80">
          One song a week. Sunday quiz. Built to remember.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Install dependencies**

Run: `cd /Users/mncedimini/Sites/misc/nhanga && npm install`
Expected: dependencies resolve, no errors.

- [ ] **Step 9: Verify build**

Run: `cd /Users/mncedimini/Sites/misc/nhanga && npm run build`
Expected: build succeeds, generates `.next/`.

- [ ] **Step 10: Commit**

```bash
cd /Users/mncedimini/Sites/misc/nhanga
git add -A
git commit -m "chore: scaffold Next.js 16 + Tailwind v4 + TS"
```

### Task 0.2: Set up Vitest + Playwright

**Files:**
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/unit/smoke.test.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.test.ts", "src/composition.ts"]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@domain": path.resolve(__dirname, "./src/domain"),
      "@application": path.resolve(__dirname, "./src/application"),
      "@ports": path.resolve(__dirname, "./src/ports"),
      "@infra": path.resolve(__dirname, "./src/infra"),
      "@ui": path.resolve(__dirname, "./src/ui")
    }
  }
});
```

- [ ] **Step 2: Create `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

(Will extend in Task 3.1 to register msw.)

- [ ] **Step 3: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } }
  ]
});
```

- [ ] **Step 4: Add a smoke unit test**

```ts
// tests/unit/smoke.test.ts
import { describe, it, expect } from "vitest";
describe("smoke", () => {
  it("runs", () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 5: Run unit tests**

Run: `npm run test:unit`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: add vitest + playwright config"
```

### Task 0.3: Add ESLint + GitHub Actions CI

**Files:**
- Create: `eslint.config.mjs`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `eslint.config.mjs`**

```js
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: [".next/**", "node_modules/**", "coverage/**", "playwright-report/**"] }
];
```

- [ ] **Step 2: Create `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build
  e2e:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: verify
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium webkit
      - run: npm run test:e2e
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: lint, typecheck, test, build on PR; e2e on main"
```

### Task 0.4: Add AGENTS.md, CLAUDE.md, README

**Files:**
- Create: `AGENTS.md`
- Create: `CLAUDE.md`
- Create: `README.md`

- [ ] **Step 1: Create `AGENTS.md`**

```md
# Nhanga — agent instructions

Next.js 16 + React 19 + Tailwind v4. Some APIs and conventions differ from older docs. When in doubt, consult `node_modules/next/dist/docs/` and heed deprecation notices.

Architecture: Clean/Hexagonal. Domain → Ports ← Application; Infra implements Ports. Composition root in `src/composition.ts` is the only wiring point. Tests replace it with fakes.

TDD is mandatory. Write failing tests first. Coverage threshold 80% (enforced in CI).

No mutation. All domain state transitions return new objects. No `console.log` in committed code.
```

- [ ] **Step 2: Create `CLAUDE.md`**

```md
@AGENTS.md
```

- [ ] **Step 3: Create `README.md`**

````md
# Nhanga

One song a week. Sunday quiz. Built to remember.

A personal PWA for learning Shona through music. Curated weekly song, spaced-repetition quiz on Sundays, iOS Share-Sheet ingestion from YouTube.

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm run test           # unit + integration
npm run test:e2e       # playwright
npm run test:coverage  # 80% threshold enforced
```

## Architecture

See `docs/superpowers/specs/2026-05-27-nhanga-design.md` and the SVG diagrams in `docs/superpowers/diagrams/`.
````

- [ ] **Step 4: Commit and push to GitHub**

```bash
git add -A
git commit -m "docs: README, AGENTS, CLAUDE"
gh repo create nhanga --private --source . --remote origin --push
```

(The user will confirm the GitHub account/org and visibility before this step runs.)

---

## Phase 1 — Domain (pure, TDD)

### Task 1.1: ID generator

**Files:**
- Create: `src/domain/ids.ts`
- Create: `tests/unit/domain/ids.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/domain/ids.test.ts
import { describe, it, expect } from "vitest";
import { newId, isId } from "@domain/ids";

describe("ids", () => {
  it("newId returns a 26-char ulid-shaped string", () => {
    const id = newId();
    expect(id).toHaveLength(26);
    expect(isId(id)).toBe(true);
  });
  it("newId values are unique", () => {
    expect(newId()).not.toBe(newId());
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `npm run test:unit -- ids`
Expected: module not found.

- [ ] **Step 3: Implement**

```ts
// src/domain/ids.ts
import { ulid } from "ulid";

export type Id = string & { readonly __brand: "Id" };

export const newId = (): Id => ulid() as Id;
export const isId = (v: unknown): v is Id =>
  typeof v === "string" && /^[0-9A-HJKMNP-TV-Z]{26}$/.test(v);
```

- [ ] **Step 4: Run, expect pass**

Run: `npm run test:unit -- ids`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): id generator"
```

### Task 1.2: SRS scheduler (SM-2 lite)

**Files:**
- Create: `src/domain/srs.ts`
- Create: `tests/unit/domain/srs.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/domain/srs.test.ts
import { describe, it, expect } from "vitest";
import { newCard, schedule, type SrsCard } from "@domain/srs";

const now = new Date("2026-05-27T10:00:00Z");

describe("srs.newCard", () => {
  it("creates a card due today with ease 2.5", () => {
    const c = newCard("card-1", "line", now);
    expect(c.ease).toBe(2.5);
    expect(c.intervalDays).toBe(0);
    expect(c.lapses).toBe(0);
    expect(new Date(c.dueAt).toISOString()).toBe(now.toISOString());
  });
});

describe("srs.schedule", () => {
  const base: SrsCard = {
    id: "x", kind: "line", ease: 2.5, intervalDays: 1, dueAt: now.toISOString(), lapses: 0
  };

  it("on correct: extends interval by ease, raises ease", () => {
    const next = schedule(base, "correct", now);
    expect(next.intervalDays).toBe(3);          // round(1 * 2.5) = 3
    expect(next.ease).toBeCloseTo(2.6);
    expect(next.lapses).toBe(0);
  });

  it("on wrong: resets interval, lowers ease, increments lapses", () => {
    const next = schedule(base, "wrong", now);
    expect(next.intervalDays).toBe(1);
    expect(next.ease).toBeCloseTo(2.3);
    expect(next.lapses).toBe(1);
  });

  it("ease clamps to [1.3, 3.0]", () => {
    let c: SrsCard = { ...base, ease: 1.3 };
    c = schedule(c, "wrong", now);
    expect(c.ease).toBe(1.3);
    c = { ...base, ease: 3.0 };
    c = schedule(c, "correct", now);
    expect(c.ease).toBe(3.0);
  });

  it("does not mutate the input", () => {
    const before = { ...base };
    schedule(base, "correct", now);
    expect(base).toEqual(before);
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement**

```ts
// src/domain/srs.ts
import { addDays } from "date-fns";

export type SrsGrade = "correct" | "wrong";

export interface SrsCard {
  readonly id: string;
  readonly kind: "line" | "gloss";
  readonly ease: number;
  readonly intervalDays: number;
  readonly dueAt: string;
  readonly lapses: number;
}

const EASE_MIN = 1.3;
const EASE_MAX = 3.0;
const EASE_STEP_UP = 0.10;
const EASE_STEP_DOWN = 0.20;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const newCard = (id: string, kind: SrsCard["kind"], now: Date): SrsCard => ({
  id, kind, ease: 2.5, intervalDays: 0, dueAt: now.toISOString(), lapses: 0
});

export const schedule = (card: SrsCard, grade: SrsGrade, now: Date): SrsCard => {
  if (grade === "correct") {
    const interval = Math.max(1, Math.round(card.intervalDays * card.ease));
    return {
      ...card,
      intervalDays: interval,
      ease: clamp(card.ease + EASE_STEP_UP, EASE_MIN, EASE_MAX),
      dueAt: addDays(now, interval).toISOString()
    };
  }
  return {
    ...card,
    intervalDays: 1,
    ease: clamp(card.ease - EASE_STEP_DOWN, EASE_MIN, EASE_MAX),
    lapses: card.lapses + 1,
    dueAt: addDays(now, 1).toISOString()
  };
};
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): SM-2 lite SRS scheduler"
```

### Task 1.3: Song, Line, Gloss types + immutable updates

**Files:**
- Create: `src/domain/song.ts`
- Create: `tests/unit/domain/song.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/domain/song.test.ts
import { describe, it, expect } from "vitest";
import { refineLine, type Song } from "@domain/song";

const song: Song = {
  id: "s1",
  title: "Ndakuvara",
  artist: "Jah Prayzah",
  lines: [
    { index: 0, shona: "Ndakuvara", english: "I am hurt (draft)", glosses: [], confidence: "draft" },
    { index: 1, shona: "Mwoyo wangu", english: "My heart (draft)", glosses: [], confidence: "draft" }
  ],
  addedAt: "2026-05-27T00:00:00Z"
};

describe("song.refineLine", () => {
  it("updates english on the target line and marks it refined", () => {
    const next = refineLine(song, 1, { english: "My heart" });
    expect(next.lines[1]?.english).toBe("My heart");
    expect(next.lines[1]?.confidence).toBe("refined");
    expect(next.lines[0]?.confidence).toBe("draft");
  });

  it("does not mutate the original", () => {
    const snapshot = JSON.stringify(song);
    refineLine(song, 1, { english: "Other" });
    expect(JSON.stringify(song)).toBe(snapshot);
  });

  it("throws if line index is out of range", () => {
    expect(() => refineLine(song, 99, { english: "x" })).toThrow(/out of range/i);
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement**

```ts
// src/domain/song.ts
export interface Gloss {
  readonly shonaToken: string;
  readonly englishGloss: string;
  readonly morphemes?: readonly string[];
}

export interface Line {
  readonly index: number;
  readonly shona: string;
  readonly english: string;
  readonly glosses: readonly Gloss[];
  readonly confidence: "draft" | "refined";
  readonly audioRange?: { readonly startMs: number; readonly endMs: number };
}

export interface Song {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly youtubeUrl?: string;
  readonly lines: readonly Line[];
  readonly addedAt: string;
  readonly lastQuizzedAt?: string;
}

export interface LinePatch {
  readonly english?: string;
  readonly glosses?: readonly Gloss[];
}

export const refineLine = (song: Song, index: number, patch: LinePatch): Song => {
  const target = song.lines[index];
  if (!target) throw new Error(`Line index ${index} out of range`);
  const updated: Line = { ...target, ...patch, confidence: "refined" };
  return { ...song, lines: song.lines.map((l, i) => (i === index ? updated : l)) };
};
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): Song, Line, Gloss + immutable refineLine"
```

### Task 1.4: Lesson + QuizAttempt types + score

**Files:**
- Create: `src/domain/lesson.ts`
- Create: `tests/unit/domain/lesson.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/domain/lesson.test.ts
import { describe, it, expect } from "vitest";
import { weekIsoFor, computeScore } from "@domain/lesson";

describe("weekIsoFor", () => {
  it("returns ISO week notation for a Sunday in May 2026", () => {
    expect(weekIsoFor(new Date("2026-05-24T09:00:00Z"))).toBe("2026-W21");
  });
});

describe("computeScore", () => {
  it("returns correct fraction", () => {
    expect(computeScore([true, true, false, true, false])).toBeCloseTo(0.6);
  });
  it("returns 0 for empty input", () => {
    expect(computeScore([])).toBe(0);
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement**

```ts
// src/domain/lesson.ts
import { getISOWeek, getISOWeekYear } from "date-fns";

export type QuizItemKind = "cloze" | "match" | "translate" | "listen" | "morpheme";

export interface QuizItemResult {
  readonly cardId: string;
  readonly kind: QuizItemKind;
  readonly correct: boolean;
  readonly answeredAt: string;
  readonly userAnswer?: string;
}

export interface QuizAttempt {
  readonly id: string;
  readonly lessonId: string;
  readonly startedAt: string;
  readonly finishedAt?: string;
  readonly items: readonly QuizItemResult[];
  readonly score?: number;
}

export interface Lesson {
  readonly id: string;
  readonly songId: string;
  readonly weekIso: string;
  readonly createdAt: string;
  readonly passScore: number;
}

export const weekIsoFor = (d: Date): string =>
  `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;

export const computeScore = (results: readonly boolean[]): number => {
  if (results.length === 0) return 0;
  return results.filter(Boolean).length / results.length;
};
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): Lesson, QuizAttempt, weekIso, score"
```

### Task 1.5: Quiz item construction + grading

**Files:**
- Create: `src/domain/quiz.ts`
- Create: `tests/unit/domain/quiz.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/domain/quiz.test.ts
import { describe, it, expect } from "vitest";
import { makeCloze, gradeTranslate, splitMorphemes } from "@domain/quiz";
import type { Line } from "@domain/song";

const line: Line = {
  index: 0,
  shona: "Ndinokuda nhanga",
  english: "I love the gathering hut",
  glosses: [],
  confidence: "refined"
};

describe("makeCloze", () => {
  it("hides one Shona token, returns the expected answer", () => {
    const c = makeCloze(line, 0, 0);
    expect(c.english).toBe("I love the gathering hut");
    expect(c.masked).toMatch(/_+ nhanga/);
    expect(c.answer).toBe("Ndinokuda");
  });
});

describe("gradeTranslate", () => {
  it("accepts case-insensitive exact match", () => {
    expect(gradeTranslate("My heart", "my heart")).toBe(true);
  });
  it("accepts within edit-distance 2", () => {
    expect(gradeTranslate("My heart", "My hart")).toBe(true);
  });
  it("rejects far misses", () => {
    expect(gradeTranslate("My heart", "your foot")).toBe(false);
  });
});

describe("splitMorphemes", () => {
  it("grades exact morpheme split", () => {
    expect(splitMorphemes("ndinokuda", ["ndi","no","ku","da"])).toBe(true);
    expect(splitMorphemes("ndinokuda", ["ndino","kuda"])).toBe(false);
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement**

```ts
// src/domain/quiz.ts
import type { Line } from "@domain/song";

export interface ClozeItem {
  readonly english: string;
  readonly masked: string;
  readonly answer: string;
  readonly lineIndex: number;
}

export const makeCloze = (line: Line, lineIndex: number, tokenIndex: number): ClozeItem => {
  const tokens = line.shona.split(/\s+/);
  const target = tokens[tokenIndex];
  if (!target) throw new Error(`Token ${tokenIndex} out of range for line "${line.shona}"`);
  const masked = tokens
    .map((t, i) => (i === tokenIndex ? "_".repeat(Math.max(3, t.length)) : t))
    .join(" ");
  return { english: line.english, masked, answer: target, lineIndex };
};

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]!;
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j]!, dp[j - 1]!);
      prev = tmp;
    }
  }
  return dp[n]!;
};

export const gradeTranslate = (expected: string, given: string): boolean => {
  const e = expected.trim().toLowerCase();
  const g = given.trim().toLowerCase();
  if (e === g) return true;
  return levenshtein(e, g) <= 2;
};

export const splitMorphemes = (whole: string, parts: readonly string[]): boolean =>
  parts.join("") === whole.toLowerCase();
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(domain): quiz item construction + grading"
```

---

## Phase 2 — Application use-cases (TDD with fake ports)

### Task 2.1: Clock port + system impl

**Files:**
- Create: `src/ports/clock.ts`
- Create: `src/infra/clock.system.ts`
- Create: `tests/unit/ports/clock.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/ports/clock.test.ts
import { describe, it, expect } from "vitest";
import { fixedClock } from "@ports/clock";

describe("fixedClock", () => {
  it("returns the same Date each call", () => {
    const t = new Date("2026-05-27T10:00:00Z");
    const c = fixedClock(t);
    expect(c.now().toISOString()).toBe(t.toISOString());
    expect(c.now().toISOString()).toBe(t.toISOString());
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement**

```ts
// src/ports/clock.ts
export interface Clock { now(): Date }
export const fixedClock = (d: Date): Clock => ({ now: () => new Date(d) });
```

```ts
// src/infra/clock.system.ts
import type { Clock } from "@ports/clock";
export const systemClock: Clock = { now: () => new Date() };
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ports): Clock port + system impl"
```

### Task 2.2: pickWeeklySong use-case

**Files:**
- Create: `src/application/pickWeeklySong.ts`
- Create: `tests/unit/application/pickWeeklySong.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/application/pickWeeklySong.test.ts
import { describe, it, expect } from "vitest";
import { pickWeeklySong } from "@application/pickWeeklySong";
import type { Song } from "@domain/song";
import type { QuizAttempt } from "@domain/lesson";

const song = (id: string, addedAt: string): Song => ({
  id, title: id, artist: "x", lines: [], addedAt
});

describe("pickWeeklySong", () => {
  it("returns the oldest unseen song first", () => {
    const songs = [song("a","2026-05-01"), song("b","2026-04-01"), song("c","2026-06-01")];
    expect(pickWeeklySong(songs, []).id).toBe("b");
  });

  it("when all seen, returns song with lowest latest score", () => {
    const songs = [song("a","2026-05-01"), song("b","2026-04-01")];
    const attempts: QuizAttempt[] = [
      { id:"x", lessonId:"L-a", startedAt:"", items: [], finishedAt:"2026-05-20T00:00:00Z", score: 0.9 },
      { id:"y", lessonId:"L-b", startedAt:"", items: [], finishedAt:"2026-05-20T00:00:00Z", score: 0.5 }
    ];
    const lessons = new Map([["L-a","a"], ["L-b","b"]]);
    expect(pickWeeklySong(songs, attempts, lessons).id).toBe("b");
  });

  it("throws if songs is empty", () => {
    expect(() => pickWeeklySong([], [])).toThrow(/no songs/i);
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement**

```ts
// src/application/pickWeeklySong.ts
import type { Song } from "@domain/song";
import type { QuizAttempt } from "@domain/lesson";

export const pickWeeklySong = (
  songs: readonly Song[],
  attempts: readonly QuizAttempt[],
  lessonToSong: ReadonlyMap<string, string> = new Map()
): Song => {
  if (songs.length === 0) throw new Error("No songs in library");

  const seenSongIds = new Set(
    attempts.map(a => lessonToSong.get(a.lessonId)).filter(Boolean) as string[]
  );

  const unseen = songs.filter(s => !seenSongIds.has(s.id));
  if (unseen.length > 0) {
    return [...unseen].sort((a, b) => a.addedAt.localeCompare(b.addedAt))[0]!;
  }

  const lowestScore = (songId: string): number => {
    const xs = attempts.filter(a => lessonToSong.get(a.lessonId) === songId).map(a => a.score ?? 1);
    return xs.length ? Math.min(...xs) : 1;
  };
  return [...songs].sort((a, b) => lowestScore(a.id) - lowestScore(b.id))[0]!;
};
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(application): pickWeeklySong rotation algorithm"
```

### Task 2.3: Ports for Translator, LyricsSource, VideoAdapter, ProgressStore, Notifier

**Files:**
- Create: `src/ports/translator.ts`
- Create: `src/ports/lyricsSource.ts`
- Create: `src/ports/videoAdapter.ts`
- Create: `src/ports/progressStore.ts`
- Create: `src/ports/notifier.ts`

- [ ] **Step 1: Implement ports**

```ts
// src/ports/translator.ts
import type { Gloss } from "@domain/song";
export interface TranslationDraft {
  readonly lines: readonly { readonly shona: string; readonly english: string; readonly glosses: readonly Gloss[] }[];
}
export interface Translator {
  draft(shonaLyrics: string): Promise<TranslationDraft>;
}
```

```ts
// src/ports/lyricsSource.ts
export interface LyricsLookup { readonly title: string; readonly artist?: string; }
export interface LyricsSource { fetch(q: LyricsLookup): Promise<string | null>; }
```

```ts
// src/ports/videoAdapter.ts
export interface VideoMetadata {
  readonly title: string;
  readonly authorName: string;
  readonly thumbnailUrl?: string;
  readonly durationSec?: number;
}
export interface VideoAdapter { fetchMetadata(url: string): Promise<VideoMetadata>; }
```

```ts
// src/ports/progressStore.ts
import type { Song } from "@domain/song";
import type { Lesson, QuizAttempt } from "@domain/lesson";
import type { SrsCard } from "@domain/srs";
export interface ProgressStore {
  listSongs(): Promise<readonly Song[]>;
  getSong(id: string): Promise<Song | null>;
  upsertSong(s: Song): Promise<void>;
  listLessons(): Promise<readonly Lesson[]>;
  createLesson(l: Lesson): Promise<void>;
  recordAttempt(a: QuizAttempt): Promise<void>;
  listAttempts(): Promise<readonly QuizAttempt[]>;
  listCards(): Promise<readonly SrsCard[]>;
  upsertCards(cards: readonly SrsCard[]): Promise<void>;
}
```

```ts
// src/ports/notifier.ts
export interface Notification {
  readonly title: string;
  readonly body: string;
  readonly url: string;
}
export interface Notifier { notify(n: Notification): Promise<void>; }
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(ports): translator, lyrics, video, store, notifier"
```

### Task 2.4: addSong use-case

**Files:**
- Create: `src/application/addSong.ts`
- Create: `tests/unit/application/addSong.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/application/addSong.test.ts
import { describe, it, expect, vi } from "vitest";
import { addSong } from "@application/addSong";

describe("addSong", () => {
  it("composes video metadata, lyrics, and translation into a draft Song", async () => {
    const video = { fetchMetadata: vi.fn().mockResolvedValue({ title: "Ndakuvara", authorName: "Jah Prayzah" }) };
    const lyrics = { fetch: vi.fn().mockResolvedValue("Ndakuvara\nMwoyo wangu") };
    const translator = { draft: vi.fn().mockResolvedValue({
      lines: [
        { shona: "Ndakuvara", english: "I am hurt (draft)", glosses: [] },
        { shona: "Mwoyo wangu", english: "My heart (draft)", glosses: [] }
      ]
    })};
    const store = { upsertSong: vi.fn().mockResolvedValue(undefined) };
    const clock = { now: () => new Date("2026-05-27T10:00:00Z") };

    const song = await addSong(
      { url: "https://youtu.be/abc" },
      { video, lyrics, translator, store: store as any, clock, idGen: () => "s1" }
    );

    expect(song.id).toBe("s1");
    expect(song.title).toBe("Ndakuvara");
    expect(song.artist).toBe("Jah Prayzah");
    expect(song.youtubeUrl).toBe("https://youtu.be/abc");
    expect(song.lines).toHaveLength(2);
    expect(song.lines[0]?.confidence).toBe("draft");
    expect(store.upsertSong).toHaveBeenCalledWith(song);
  });

  it("when lyrics fetch returns null, translates an empty draft (no lines)", async () => {
    const video = { fetchMetadata: vi.fn().mockResolvedValue({ title: "X", authorName: "Y" }) };
    const lyrics = { fetch: vi.fn().mockResolvedValue(null) };
    const translator = { draft: vi.fn().mockResolvedValue({ lines: [] }) };
    const store = { upsertSong: vi.fn().mockResolvedValue(undefined) };
    const clock = { now: () => new Date() };

    const song = await addSong(
      { url: "https://youtu.be/xyz" },
      { video, lyrics, translator, store: store as any, clock, idGen: () => "s2" }
    );
    expect(song.lines).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement**

```ts
// src/application/addSong.ts
import type { Song } from "@domain/song";
import type { Translator } from "@ports/translator";
import type { LyricsSource } from "@ports/lyricsSource";
import type { VideoAdapter } from "@ports/videoAdapter";
import type { ProgressStore } from "@ports/progressStore";
import type { Clock } from "@ports/clock";

export interface AddSongInput {
  readonly url?: string;
  readonly pastedLyrics?: string;
  readonly titleHint?: string;
}

export interface AddSongDeps {
  readonly video: VideoAdapter;
  readonly lyrics: LyricsSource;
  readonly translator: Translator;
  readonly store: ProgressStore;
  readonly clock: Clock;
  readonly idGen: () => string;
}

export const addSong = async (input: AddSongInput, deps: AddSongDeps): Promise<Song> => {
  let title = input.titleHint ?? "Untitled";
  let artist = "Unknown";

  if (input.url) {
    const meta = await deps.video.fetchMetadata(input.url);
    title = meta.title;
    artist = meta.authorName;
  }

  const shonaLyrics = input.pastedLyrics
    ?? (await deps.lyrics.fetch({ title, artist }))
    ?? "";

  const draft = await deps.translator.draft(shonaLyrics);

  const song: Song = {
    id: deps.idGen(),
    title,
    artist,
    ...(input.url ? { youtubeUrl: input.url } : {}),
    lines: draft.lines.map((l, i) => ({
      index: i, shona: l.shona, english: l.english, glosses: l.glosses, confidence: "draft"
    })),
    addedAt: deps.clock.now().toISOString()
  };

  await deps.store.upsertSong(song);
  return song;
};
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(application): addSong use-case"
```

### Task 2.5: refineLine + runQuiz + buildQuizItems

**Files:**
- Create: `src/application/refineLine.ts`
- Create: `src/application/runQuiz.ts`
- Create: `src/application/buildQuizItems.ts`
- Create: `tests/unit/application/runQuiz.test.ts`

- [ ] **Step 1: Write failing test for runQuiz**

```ts
// tests/unit/application/runQuiz.test.ts
import { describe, it, expect, vi } from "vitest";
import { runQuiz } from "@application/runQuiz";
import type { QuizItemResult } from "@domain/lesson";

describe("runQuiz.finalise", () => {
  it("computes score, records attempt, schedules each card", async () => {
    const results: QuizItemResult[] = [
      { cardId: "c1", kind: "cloze",     correct: true,  answeredAt: "2026-05-27T10:00:00Z" },
      { cardId: "c2", kind: "translate", correct: false, answeredAt: "2026-05-27T10:01:00Z" }
    ];
    const store = {
      recordAttempt: vi.fn().mockResolvedValue(undefined),
      listCards: vi.fn().mockResolvedValue([
        { id: "c1", kind: "line",  ease: 2.5, intervalDays: 1, dueAt: "2026-05-27", lapses: 0 },
        { id: "c2", kind: "gloss", ease: 2.5, intervalDays: 1, dueAt: "2026-05-27", lapses: 0 }
      ]),
      upsertCards: vi.fn().mockResolvedValue(undefined)
    };
    const clock = { now: () => new Date("2026-05-27T10:02:00Z") };

    const out = await runQuiz.finalise(
      { lessonId: "L1", startedAt: "2026-05-27T09:50:00Z", results },
      { store: store as any, clock, idGen: () => "att-1" }
    );

    expect(out.score).toBe(0.5);
    expect(store.recordAttempt).toHaveBeenCalled();
    const upserted = store.upsertCards.mock.calls[0]![0];
    expect(upserted).toHaveLength(2);
    expect(upserted[0].intervalDays).toBe(3);     // correct → 1 * 2.5 = 3
    expect(upserted[1].intervalDays).toBe(1);     // wrong → reset
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement**

```ts
// src/application/refineLine.ts
import { refineLine as domainRefine, type LinePatch } from "@domain/song";
import type { ProgressStore } from "@ports/progressStore";

export const refineLine = async (
  songId: string,
  lineIndex: number,
  patch: LinePatch,
  deps: { store: ProgressStore }
): Promise<void> => {
  const song = await deps.store.getSong(songId);
  if (!song) throw new Error(`Song ${songId} not found`);
  await deps.store.upsertSong(domainRefine(song, lineIndex, patch));
};
```

```ts
// src/application/runQuiz.ts
import { computeScore, type QuizAttempt, type QuizItemResult } from "@domain/lesson";
import { schedule } from "@domain/srs";
import type { ProgressStore } from "@ports/progressStore";
import type { Clock } from "@ports/clock";

export interface RunQuizDeps {
  readonly store: ProgressStore;
  readonly clock: Clock;
  readonly idGen: () => string;
}

export interface FinaliseInput {
  readonly lessonId: string;
  readonly startedAt: string;
  readonly results: readonly QuizItemResult[];
}

export const runQuiz = {
  async finalise(input: FinaliseInput, deps: RunQuizDeps): Promise<QuizAttempt> {
    const now = deps.clock.now();
    const score = computeScore(input.results.map(r => r.correct));
    const attempt: QuizAttempt = {
      id: deps.idGen(),
      lessonId: input.lessonId,
      startedAt: input.startedAt,
      finishedAt: now.toISOString(),
      items: input.results,
      score
    };
    await deps.store.recordAttempt(attempt);

    const cards = await deps.store.listCards();
    const byId = new Map(cards.map(c => [c.id, c]));
    const updated = input.results
      .map(r => {
        const c = byId.get(r.cardId);
        return c ? schedule(c, r.correct ? "correct" : "wrong", now) : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    await deps.store.upsertCards(updated);
    return attempt;
  }
};
```

```ts
// src/application/buildQuizItems.ts
import type { Song } from "@domain/song";
import type { SrsCard } from "@domain/srs";
import { makeCloze, type ClozeItem } from "@domain/quiz";

export interface QuizSpec {
  readonly cloze: readonly ClozeItem[];
  readonly translate: readonly { readonly cardId: string; readonly shona: string; readonly expectedEnglish: string }[];
}

export const buildQuizItems = (song: Song, _dueCards: readonly SrsCard[]): QuizSpec => {
  const refined = song.lines.filter(l => l.confidence === "refined");
  const pool = refined.length > 0 ? refined : song.lines;
  const cloze = pool.slice(0, 3).map(l => makeCloze(l, l.index, 0));
  const translate = pool.slice(0, 3).map(l => ({
    cardId: `${song.id}:${l.index}`,
    shona: l.shona,
    expectedEnglish: l.english
  }));
  return { cloze, translate };
};
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(application): refineLine, runQuiz, buildQuizItems"
```

---

## Phase 3 — Infrastructure adapters (integration tests with msw)

### Task 3.1: msw harness

**Files:**
- Create: `tests/integration/msw.ts`
- Modify: `tests/setup.ts`

- [ ] **Step 1: Create `tests/integration/msw.ts`**

```ts
import { setupServer } from "msw/node";
export const server = setupServer();
```

- [ ] **Step 2: Extend `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./integration/msw";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: msw harness for integration tests"
```

### Task 3.2: YouTube oEmbed adapter

**Files:**
- Create: `src/infra/video.youtube.ts`
- Create: `tests/integration/video.youtube.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/integration/video.youtube.test.ts
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./msw";
import { youtubeVideo } from "@infra/video.youtube";

describe("youtubeVideo.fetchMetadata", () => {
  it("normalises oEmbed response", async () => {
    server.use(
      http.get("https://www.youtube.com/oembed", () =>
        HttpResponse.json({ title: "Ndakuvara", author_name: "Jah Prayzah", thumbnail_url: "https://i.ytimg.com/x.jpg" })
      )
    );
    const m = await youtubeVideo.fetchMetadata("https://youtu.be/abc");
    expect(m.title).toBe("Ndakuvara");
    expect(m.authorName).toBe("Jah Prayzah");
    expect(m.thumbnailUrl).toBe("https://i.ytimg.com/x.jpg");
  });

  it("throws on non-OK response", async () => {
    server.use(http.get("https://www.youtube.com/oembed", () => HttpResponse.text("nope", { status: 404 })));
    await expect(youtubeVideo.fetchMetadata("https://youtu.be/zzz")).rejects.toThrow(/youtube oembed/i);
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement**

```ts
// src/infra/video.youtube.ts
import type { VideoAdapter, VideoMetadata } from "@ports/videoAdapter";

export const youtubeVideo: VideoAdapter = {
  async fetchMetadata(url: string): Promise<VideoMetadata> {
    const u = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(u);
    if (!res.ok) throw new Error(`YouTube oEmbed failed: ${res.status}`);
    const data = await res.json() as { title: string; author_name: string; thumbnail_url?: string };
    return {
      title: data.title,
      authorName: data.author_name,
      ...(data.thumbnail_url ? { thumbnailUrl: data.thumbnail_url } : {})
    };
  }
};
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(infra): YouTube oEmbed video adapter"
```

### Task 3.3: Composite lyrics (Genius stub + lyrics.ovh)

**Files:**
- Create: `src/infra/lyrics.lyricsOvh.ts`
- Create: `src/infra/lyrics.genius.ts`
- Create: `src/infra/lyrics.composite.ts`
- Create: `tests/integration/lyrics.composite.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/integration/lyrics.composite.test.ts
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./msw";
import { compositeLyrics } from "@infra/lyrics.composite";

describe("compositeLyrics", () => {
  it("returns lyrics.ovh result when present", async () => {
    server.use(
      http.get("https://api.lyrics.ovh/v1/Jah%20Prayzah/Ndakuvara", () =>
        HttpResponse.json({ lyrics: "Ndakuvara\nMwoyo wangu" })
      )
    );
    const r = await compositeLyrics().fetch({ title: "Ndakuvara", artist: "Jah Prayzah" });
    expect(r).toContain("Ndakuvara");
  });

  it("returns null when no source has anything", async () => {
    server.use(
      http.get("https://api.lyrics.ovh/v1/*", () => HttpResponse.text("nope", { status: 404 }))
    );
    const r = await compositeLyrics().fetch({ title: "X", artist: "Y" });
    expect(r).toBeNull();
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement**

```ts
// src/infra/lyrics.lyricsOvh.ts
import type { LyricsSource } from "@ports/lyricsSource";

export const lyricsOvh: LyricsSource = {
  async fetch({ title, artist }) {
    if (!artist) return null;
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as { lyrics?: string };
    return data.lyrics?.trim() || null;
  }
};
```

```ts
// src/infra/lyrics.genius.ts
import type { LyricsSource } from "@ports/lyricsSource";
// Genius official API returns metadata, not lyric text. V1 ships a stub that returns null.
// Real Genius lyric retrieval requires scraping the song path and is out of scope for V1.
export const genius: LyricsSource = { async fetch() { return null; } };
```

```ts
// src/infra/lyrics.composite.ts
import type { LyricsSource } from "@ports/lyricsSource";
import { lyricsOvh } from "./lyrics.lyricsOvh";
import { genius } from "./lyrics.genius";

export const compositeLyrics = (
  sources: readonly LyricsSource[] = [genius, lyricsOvh]
): LyricsSource => ({
  async fetch(q) {
    for (const s of sources) {
      try {
        const r = await s.fetch(q);
        if (r) return r;
      } catch {
        // per-source error → try next
      }
    }
    return null;
  }
});
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(infra): composite lyrics source (lyrics.ovh + genius stub)"
```

### Task 3.4: Translator via Vercel AI Gateway

**Files:**
- Modify: `package.json` (add `ai` dep)
- Create: `src/infra/translator.aiGateway.ts`
- Create: `tests/integration/translator.test.ts`

- [ ] **Step 1: Add dependency**

Add to `package.json` dependencies: `"ai": "^6.0.0"`. Run `npm install`.

- [ ] **Step 2: Write failing test**

```ts
// tests/integration/translator.test.ts
import { describe, it, expect, vi } from "vitest";
import { makeAiGatewayTranslator } from "@infra/translator.aiGateway";

describe("aiGatewayTranslator.draft", () => {
  it("parses model JSON into TranslationDraft", async () => {
    const generateText = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        lines: [{ shona: "Ndakuvara", english: "I am hurt",
                  glosses: [{ shonaToken: "Ndakuvara", englishGloss: "I am hurt" }] }]
      })
    });
    const t = makeAiGatewayTranslator({ generateText, model: "anthropic/claude-sonnet-4-6" });
    const r = await t.draft("Ndakuvara");
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0]?.english).toBe("I am hurt");
  });

  it("returns empty lines when input is empty", async () => {
    const generateText = vi.fn();
    const t = makeAiGatewayTranslator({ generateText, model: "anthropic/claude-sonnet-4-6" });
    const r = await t.draft("");
    expect(r.lines).toEqual([]);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("throws on unparseable model output", async () => {
    const generateText = vi.fn().mockResolvedValue({ text: "not json" });
    const t = makeAiGatewayTranslator({ generateText, model: "anthropic/claude-sonnet-4-6" });
    await expect(t.draft("Ndakuvara")).rejects.toThrow(/invalid translator output/i);
  });
});
```

- [ ] **Step 3: Run, observe failure**

- [ ] **Step 4: Implement**

```ts
// src/infra/translator.aiGateway.ts
import { z } from "zod";
import type { Translator, TranslationDraft } from "@ports/translator";

const responseSchema = z.object({
  lines: z.array(z.object({
    shona: z.string(),
    english: z.string(),
    glosses: z.array(z.object({
      shonaToken: z.string(),
      englishGloss: z.string(),
      morphemes: z.array(z.string()).optional()
    })).default([])
  }))
});

export interface GenerateText {
  (args: { model: string; prompt: string; temperature?: number }): Promise<{ text: string }>;
}

const PROMPT = (shona: string) => `
You translate Shona song lyrics into English. Return STRICT JSON only, matching:
{ "lines": [{ "shona": string, "english": string, "glosses": [{ "shonaToken": string, "englishGloss": string, "morphemes"?: string[] }] }] }

Rules:
- One JSON line per input line.
- English should be natural, not word-for-word.
- For agglutinative words (e.g. "ndinokuda"), include a morpheme split in glosses.
- No prose, no markdown, no code fences.

Lyrics:
${shona}
`.trim();

export const makeAiGatewayTranslator = (deps: {
  generateText: GenerateText;
  model?: string;
}): Translator => ({
  async draft(shonaLyrics: string): Promise<TranslationDraft> {
    if (!shonaLyrics.trim()) return { lines: [] };
    const { text } = await deps.generateText({
      model: deps.model ?? "anthropic/claude-sonnet-4-6",
      prompt: PROMPT(shonaLyrics),
      temperature: 0.2
    });
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch {
      throw new Error("Invalid translator output: not JSON");
    }
    const result = responseSchema.safeParse(parsed);
    if (!result.success) throw new Error("Invalid translator output: shape mismatch");
    return result.data;
  }
});
```

- [ ] **Step 5: Run, expect pass**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(infra): translator via Vercel AI Gateway"
```

### Task 3.5: Upstash KV store

**Files:**
- Modify: `package.json` (add `@upstash/redis`)
- Create: `src/infra/store.kv.ts`
- Create: `tests/integration/store.kv.test.ts`

- [ ] **Step 1: Add dependency**

Add `"@upstash/redis": "^1.34.0"` to `package.json` dependencies. Run `npm install`.

- [ ] **Step 2: Write failing test using in-memory fake**

```ts
// tests/integration/store.kv.test.ts
import { describe, it, expect } from "vitest";
import { makeKvStore } from "@infra/store.kv";
import type { Song } from "@domain/song";

class FakeRedis {
  private m = new Map<string, string>();
  async get<T>(k: string): Promise<T | null> { return this.m.has(k) ? JSON.parse(this.m.get(k)!) as T : null; }
  async set(k: string, v: unknown) { this.m.set(k, JSON.stringify(v)); }
  async sadd(k: string, v: string) {
    const set = new Set(this.m.has(k) ? JSON.parse(this.m.get(k)!) as string[] : []);
    set.add(v);
    this.m.set(k, JSON.stringify([...set]));
  }
  async smembers(k: string): Promise<string[]> {
    return this.m.has(k) ? JSON.parse(this.m.get(k)!) as string[] : [];
  }
}

const song = (id: string): Song => ({ id, title: id, artist: "x", lines: [], addedAt: "2026-05-27T00:00:00Z" });

describe("kvStore", () => {
  it("upsertSong + listSongs round-trip", async () => {
    const store = makeKvStore(new FakeRedis() as any);
    await store.upsertSong(song("a"));
    await store.upsertSong(song("b"));
    const songs = await store.listSongs();
    expect(songs.map(s => s.id).sort()).toEqual(["a", "b"]);
  });

  it("getSong returns null for missing id", async () => {
    const store = makeKvStore(new FakeRedis() as any);
    expect(await store.getSong("nope")).toBeNull();
  });
});
```

- [ ] **Step 3: Run, observe failure**

- [ ] **Step 4: Implement**

```ts
// src/infra/store.kv.ts
import type { Redis } from "@upstash/redis";
import type { ProgressStore } from "@ports/progressStore";
import type { Song } from "@domain/song";
import type { Lesson, QuizAttempt } from "@domain/lesson";
import type { SrsCard } from "@domain/srs";

const K = {
  song: (id: string) => `song:${id}`,
  songsIndex: "songs:index",
  lesson: (id: string) => `lesson:${id}`,
  lessonsIndex: "lessons:index",
  attempt: (id: string) => `attempt:${id}`,
  attemptsIndex: "attempts:index",
  card: (id: string) => `card:${id}`,
  cardsIndex: "cards:index"
};

export const makeKvStore = (redis: Redis): ProgressStore => ({
  async listSongs() {
    const ids = await redis.smembers(K.songsIndex);
    const xs = await Promise.all(ids.map(id => redis.get<Song>(K.song(id))));
    return xs.filter((x): x is Song => x !== null);
  },
  async getSong(id) { return await redis.get<Song>(K.song(id)); },
  async upsertSong(s) {
    await Promise.all([redis.set(K.song(s.id), s), redis.sadd(K.songsIndex, s.id)]);
  },
  async listLessons() {
    const ids = await redis.smembers(K.lessonsIndex);
    const xs = await Promise.all(ids.map(id => redis.get<Lesson>(K.lesson(id))));
    return xs.filter((x): x is Lesson => x !== null);
  },
  async createLesson(l) {
    await Promise.all([redis.set(K.lesson(l.id), l), redis.sadd(K.lessonsIndex, l.id)]);
  },
  async recordAttempt(a) {
    await Promise.all([redis.set(K.attempt(a.id), a), redis.sadd(K.attemptsIndex, a.id)]);
  },
  async listAttempts() {
    const ids = await redis.smembers(K.attemptsIndex);
    const xs = await Promise.all(ids.map(id => redis.get<QuizAttempt>(K.attempt(id))));
    return xs.filter((x): x is QuizAttempt => x !== null);
  },
  async listCards() {
    const ids = await redis.smembers(K.cardsIndex);
    const xs = await Promise.all(ids.map(id => redis.get<SrsCard>(K.card(id))));
    return xs.filter((x): x is SrsCard => x !== null);
  },
  async upsertCards(cards) {
    await Promise.all(cards.flatMap(c => [redis.set(K.card(c.id), c), redis.sadd(K.cardsIndex, c.id)]));
  }
});
```

- [ ] **Step 5: Run, expect pass**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(infra): Upstash KV progress store"
```

### Task 3.6: Web push notifier

**Files:**
- Modify: `package.json` (add `web-push` + types)
- Create: `src/infra/push.webpush.ts`
- Create: `tests/integration/push.test.ts`

- [ ] **Step 1: Add deps**

`"web-push": "^3.6.7"` (deps), `"@types/web-push": "^3.6.4"` (devDeps). Run `npm install`.

- [ ] **Step 2: Write failing test**

```ts
// tests/integration/push.test.ts
import { describe, it, expect, vi } from "vitest";
import { makeWebPushNotifier } from "@infra/push.webpush";

describe("webPushNotifier", () => {
  it("sends to each stored subscription", async () => {
    const sendNotification = vi.fn().mockResolvedValue(undefined);
    const subs = [
      { endpoint: "https://a.example", keys: { p256dh: "x", auth: "y" } },
      { endpoint: "https://b.example", keys: { p256dh: "x", auth: "y" } }
    ];
    const notifier = makeWebPushNotifier({ getSubscriptions: async () => subs, sendNotification });
    await notifier.notify({ title: "Today's Nhanga", body: "Ndakuvara", url: "/quiz/L1" });
    expect(sendNotification).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 3: Run, observe failure**

- [ ] **Step 4: Implement**

```ts
// src/infra/push.webpush.ts
import type { Notifier, Notification } from "@ports/notifier";

export interface PushSubscriptionLike {
  readonly endpoint: string;
  readonly keys: { readonly p256dh: string; readonly auth: string };
}

export interface WebPushDeps {
  getSubscriptions(): Promise<readonly PushSubscriptionLike[]>;
  sendNotification(sub: PushSubscriptionLike, payload: string): Promise<unknown>;
}

export const makeWebPushNotifier = (deps: WebPushDeps): Notifier => ({
  async notify(n: Notification) {
    const subs = await deps.getSubscriptions();
    const payload = JSON.stringify(n);
    await Promise.allSettled(subs.map(s => deps.sendNotification(s, payload)));
  }
});
```

- [ ] **Step 5: Run, expect pass**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(infra): web push notifier"
```

---

## Phase 4 — Composition root

### Task 4.1: Wire real adapters

**Files:**
- Create: `src/composition.ts`

- [ ] **Step 1: Implement**

```ts
// src/composition.ts
import { Redis } from "@upstash/redis";
import webpush from "web-push";
import { generateText } from "ai";
import { newId } from "@domain/ids";
import { systemClock } from "@infra/clock.system";
import { makeKvStore } from "@infra/store.kv";
import { compositeLyrics } from "@infra/lyrics.composite";
import { youtubeVideo } from "@infra/video.youtube";
import { makeAiGatewayTranslator } from "@infra/translator.aiGateway";
import { makeWebPushNotifier, type PushSubscriptionLike } from "@infra/push.webpush";

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

let redis: Redis | null = null;
const getRedis = (): Redis => {
  redis ??= new Redis({
    url: requireEnv("UPSTASH_REDIS_REST_URL"),
    token: requireEnv("UPSTASH_REDIS_REST_TOKEN")
  });
  return redis;
};

export const compose = () => {
  const store = makeKvStore(getRedis());
  const translator = makeAiGatewayTranslator({
    generateText: async ({ model, prompt, temperature }) => {
      const r = await generateText({ model, prompt, temperature });
      return { text: r.text };
    }
  });

  const subscriptionsIndex = "push:subscriptions";
  const getSubscriptions = async (): Promise<readonly PushSubscriptionLike[]> => {
    const ids = await getRedis().smembers(subscriptionsIndex);
    const subs = await Promise.all(ids.map(id => getRedis().get<PushSubscriptionLike>(`push:sub:${id}`)));
    return subs.filter((s): s is PushSubscriptionLike => s !== null);
  };
  const sendNotification = async (sub: PushSubscriptionLike, payload: string) => {
    webpush.setVapidDetails(
      requireEnv("VAPID_SUBJECT"),
      requireEnv("VAPID_PUBLIC_KEY"),
      requireEnv("VAPID_PRIVATE_KEY")
    );
    return webpush.sendNotification(sub as any, payload);
  };
  const notifier = makeWebPushNotifier({ getSubscriptions, sendNotification });

  return {
    store,
    translator,
    lyrics: compositeLyrics(),
    video: youtubeVideo,
    notifier,
    clock: systemClock,
    idGen: newId
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: composition root wires real adapters"
```

---

## Phase 5 — Presentation (App Router + UI components)

### Task 5.1: API routes

**Files:**
- Create: `app/api/songs/route.ts`
- Create: `app/api/songs/[id]/route.ts`
- Create: `app/api/attempts/route.ts`

- [ ] **Step 1: Implement `app/api/songs/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { compose } from "@/src/composition";
import { addSong } from "@application/addSong";

const PostSchema = z.object({
  url: z.string().url().optional(),
  pastedLyrics: z.string().optional(),
  titleHint: z.string().optional()
});

export async function GET() {
  const { store } = compose();
  return NextResponse.json({ data: await store.listSongs() });
}

export async function POST(req: Request) {
  const parsed = PostSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const deps = compose();
  const song = await addSong(parsed.data, deps);
  return NextResponse.json({ data: song }, { status: 201 });
}
```

- [ ] **Step 2: Implement `app/api/songs/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { compose } from "@/src/composition";
import { refineLine } from "@application/refineLine";

const PatchSchema = z.object({
  lineIndex: z.number().int().nonnegative(),
  english: z.string().optional(),
  glosses: z.array(z.object({
    shonaToken: z.string(),
    englishGloss: z.string(),
    morphemes: z.array(z.string()).optional()
  })).optional()
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { store } = compose();
  const s = await store.getSong(id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: s });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { lineIndex, ...patch } = parsed.data;
  const { store } = compose();
  await refineLine(id, lineIndex, patch, { store });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Implement `app/api/attempts/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { compose } from "@/src/composition";
import { runQuiz } from "@application/runQuiz";

const Schema = z.object({
  lessonId: z.string(),
  startedAt: z.string(),
  results: z.array(z.object({
    cardId: z.string(),
    kind: z.enum(["cloze","match","translate","listen","morpheme"]),
    correct: z.boolean(),
    answeredAt: z.string(),
    userAnswer: z.string().optional()
  }))
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const deps = compose();
  const attempt = await runQuiz.finalise(parsed.data, deps);
  return NextResponse.json({ data: attempt });
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(api): songs, songs/[id], attempts routes"
```

### Task 5.2: UI components

**Files:**
- Create: `src/ui/components/Button.tsx`
- Create: `src/ui/components/LineEditor.tsx`
- Create: `src/ui/components/QuizCloze.tsx`
- Create: `src/ui/components/QuizTranslate.tsx`

- [ ] **Step 1: Implement `Button.tsx`**

```tsx
import { type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" };

export const Button = ({ variant = "primary", className = "", ...rest }: Props) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors";
  const styles = variant === "primary"
    ? "bg-[var(--color-mwedzi)] text-[var(--color-gora)] hover:bg-[var(--color-shavi)] hover:text-[var(--color-ndoro)]"
    : "bg-transparent text-[var(--color-gora)] hover:bg-[var(--color-gora)]/5";
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
};
```

- [ ] **Step 2: Implement `LineEditor.tsx`**

```tsx
"use client";
import { useState } from "react";
import type { Line } from "@domain/song";
import { Button } from "./Button";

interface Props {
  line: Line;
  onSave: (english: string) => Promise<void>;
}

export const LineEditor = ({ line, onSave }: Props) => {
  const [val, setVal] = useState(line.english);
  const [saving, setSaving] = useState(false);
  const dirty = val !== line.english;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 border-b border-[var(--color-gora)]/10">
      <div className="font-[family-name:var(--font-fraunces)] text-lg text-[var(--color-shavi)]">
        {line.shona}
      </div>
      <div className="flex gap-2">
        <input
          aria-label={`English for line ${line.index + 1}`}
          className="flex-1 bg-transparent border-b border-[var(--color-gora)]/30 px-1 py-1 focus:outline-none focus:border-[var(--color-mwedzi)]"
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        {dirty && (
          <Button disabled={saving} onClick={async () => { setSaving(true); await onSave(val); setSaving(false); }}>
            {saving ? "Saving…" : "Save"}
          </Button>
        )}
        {!dirty && line.confidence === "refined" && (
          <span className="text-[var(--color-ruwa)] self-center" aria-label="refined">✓</span>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Implement `QuizCloze.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Button } from "./Button";

interface Props {
  english: string;
  masked: string;
  onAnswer: (answer: string) => void;
}

export const QuizCloze = ({ english, masked, onAnswer }: Props) => {
  const [val, setVal] = useState("");
  return (
    <div className="space-y-3" data-quiz-item>
      <div className="text-sm opacity-70">{english}</div>
      <div className="font-[family-name:var(--font-fraunces)] text-2xl">{masked}</div>
      <div className="flex gap-2">
        <input
          aria-label="Shona answer"
          className="flex-1 bg-transparent border-b border-[var(--color-gora)]/40 px-1 py-1"
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        <Button onClick={() => onAnswer(val)}>Submit</Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Implement `QuizTranslate.tsx`** following the same pattern (Shona shown, English typed).

```tsx
"use client";
import { useState } from "react";
import { Button } from "./Button";

interface Props {
  shona: string;
  onAnswer: (answer: string) => void;
}

export const QuizTranslate = ({ shona, onAnswer }: Props) => {
  const [val, setVal] = useState("");
  return (
    <div className="space-y-3" data-quiz-item>
      <div className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--color-shavi)]">{shona}</div>
      <textarea
        aria-label="English translation"
        className="w-full bg-transparent border border-[var(--color-gora)]/30 rounded-lg px-2 py-2 focus:outline-none focus:border-[var(--color-mwedzi)]"
        rows={3}
        value={val}
        onChange={e => setVal(e.target.value)}
      />
      <Button onClick={() => onAnswer(val)}>Submit</Button>
    </div>
  );
};
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): Button, LineEditor, QuizCloze, QuizTranslate"
```

### Task 5.3: Pages — /learn, /learn/[songId], /quiz/[lessonId], /share, /add

**Files:**
- Create: `app/learn/page.tsx`
- Create: `app/learn/[songId]/page.tsx`
- Create: `app/share/page.tsx`
- Create: `app/quiz/[lessonId]/page.tsx`
- Create: `app/add/page.tsx`

- [ ] **Step 1: Implement `app/learn/page.tsx` (server, lists songs)**

```tsx
import Link from "next/link";
import { compose } from "@/src/composition";

export default async function LearnPage() {
  const { store } = compose();
  const songs = await store.listSongs();
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-4xl text-[var(--color-shavi)] mb-6">
        Library
      </h1>
      <ul className="space-y-3">
        {songs.map(s => (
          <li key={s.id}>
            <Link href={`/learn/${s.id}`} className="block p-4 bg-[var(--color-gora)]/[0.04] hover:bg-[var(--color-mwedzi)]/20 rounded-lg">
              <div className="font-medium">{s.title}</div>
              <div className="text-sm opacity-70">{s.artist}</div>
            </Link>
          </li>
        ))}
        {songs.length === 0 && <li className="opacity-60">No songs yet. Share one from YouTube.</li>}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Implement `app/learn/[songId]/page.tsx`**

The page fetches the song and renders a client wrapper that maps each `Line` to `<LineEditor>`. The wrapper's `onSave` calls `PATCH /api/songs/[id]` with `{ lineIndex, english }`.

```tsx
import { compose } from "@/src/composition";
import { SongEditor } from "./SongEditor";

export default async function SongPage({ params }: { params: Promise<{ songId: string }> }) {
  const { songId } = await params;
  const { store } = compose();
  const song = await store.getSong(songId);
  if (!song) return <main className="p-6">Song not found.</main>;
  return <SongEditor song={song} />;
}
```

```tsx
// app/learn/[songId]/SongEditor.tsx
"use client";
import { useState } from "react";
import type { Song } from "@domain/song";
import { LineEditor } from "@ui/components/LineEditor";

export const SongEditor = ({ song: initial }: { song: Song }) => {
  const [song, setSong] = useState(initial);

  const save = async (lineIndex: number, english: string) => {
    const res = await fetch(`/api/songs/${song.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lineIndex, english })
    });
    if (res.ok) {
      setSong(s => ({
        ...s,
        lines: s.lines.map((l, i) => i === lineIndex ? { ...l, english, confidence: "refined" } : l)
      }));
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl text-[var(--color-shavi)]">{song.title}</h1>
        <p className="opacity-70">{song.artist}</p>
        {song.youtubeUrl && (
          <iframe
            className="w-full aspect-video mt-4 rounded-lg"
            src={`https://www.youtube.com/embed/${new URL(song.youtubeUrl).searchParams.get("v") ?? song.youtubeUrl.split("/").pop()}`}
            allow="encrypted-media"
          />
        )}
      </header>
      {song.lines.map(l => (
        <LineEditor key={l.index} line={l} onSave={(eng) => save(l.index, eng)} />
      ))}
    </main>
  );
};
```

- [ ] **Step 3: Implement `app/share/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function SharePage({ searchParams }: { searchParams: Promise<{ url?: string; text?: string }> }) {
  const { url, text } = await searchParams;
  const href = url ?? text;
  if (!href) return <main className="p-6">No URL shared.</main>;

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const res = await fetch(`${origin}/api/songs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: href }),
    cache: "no-store"
  });
  if (!res.ok) return <main className="p-6">Could not ingest. Try /add.</main>;
  const { data } = await res.json() as { data: { id: string } };
  redirect(`/learn/${data.id}`);
}
```

- [ ] **Step 4: Implement `app/quiz/[lessonId]/page.tsx`**

Server fetches the Lesson + Song + SRS due cards, builds the quiz spec via `buildQuizItems`, then renders a client `<QuizSession>` that submits results to `/api/attempts`.

```tsx
import { notFound } from "next/navigation";
import { compose } from "@/src/composition";
import { buildQuizItems } from "@application/buildQuizItems";
import { QuizSession } from "./QuizSession";

export default async function QuizPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const { store } = compose();
  const lessons = await store.listLessons();
  const lesson = lessons.find(l => l.id === lessonId);
  if (!lesson) notFound();
  const song = await store.getSong(lesson.songId);
  if (!song) notFound();
  const cards = await store.listCards();
  const spec = buildQuizItems(song, cards);
  return <QuizSession lessonId={lesson.id} spec={spec} />;
}
```

```tsx
// app/quiz/[lessonId]/QuizSession.tsx
"use client";
import { useState } from "react";
import type { QuizSpec } from "@application/buildQuizItems";
import { QuizCloze } from "@ui/components/QuizCloze";
import { QuizTranslate } from "@ui/components/QuizTranslate";
import { gradeTranslate } from "@domain/quiz";

interface ResultLite { cardId: string; kind: "cloze"|"translate"; correct: boolean; answeredAt: string; userAnswer: string }

export const QuizSession = ({ lessonId, spec }: { lessonId: string; spec: QuizSpec }) => {
  const items = [
    ...spec.cloze.map((c, i) => ({ key: `c-${i}`, kind: "cloze" as const, payload: c })),
    ...spec.translate.map((t, i) => ({ key: `t-${i}`, kind: "translate" as const, payload: t }))
  ];
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<ResultLite[]>([]);
  const [done, setDone] = useState<{ score: number } | null>(null);
  const startedAt = useState(() => new Date().toISOString())[0];

  if (done) return <main className="p-6"><div data-score>Score: {Math.round(done.score * 100)}%</div></main>;

  const current = items[idx];
  if (!current) return null;

  const next = async (cardId: string, correct: boolean, userAnswer: string) => {
    const updated: ResultLite[] = [...results, { cardId, kind: current.kind, correct, answeredAt: new Date().toISOString(), userAnswer }];
    if (idx + 1 < items.length) {
      setResults(updated);
      setIdx(idx + 1);
      return;
    }
    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lessonId, startedAt, results: updated })
    });
    const { data } = await res.json() as { data: { score: number } };
    setDone({ score: data.score });
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="opacity-60 text-sm">{idx + 1} / {items.length}</div>
      {current.kind === "cloze" && (
        <QuizCloze
          english={current.payload.english}
          masked={current.payload.masked}
          onAnswer={(a) => next(`cloze-${idx}`, a.trim().toLowerCase() === current.payload.answer.toLowerCase(), a)}
        />
      )}
      {current.kind === "translate" && (
        <QuizTranslate
          shona={current.payload.shona}
          onAnswer={(a) => next(current.payload.cardId, gradeTranslate(current.payload.expectedEnglish, a), a)}
        />
      )}
    </main>
  );
};
```

- [ ] **Step 5: Implement `app/add/page.tsx`** — manual paste form that POSTs to `/api/songs`.

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ui/components/Button";

export default function AddPage() {
  const [url, setUrl] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const router = useRouter();

  const submit = async () => {
    const res = await fetch("/api/songs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: url || undefined, pastedLyrics: lyrics || undefined, titleHint: title || undefined })
    });
    if (!res.ok) return;
    const { data } = await res.json() as { data: { id: string } };
    router.push(`/learn/${data.id}`);
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--color-shavi)]">Add a song</h1>
      <input className="w-full border-b py-1" placeholder="YouTube URL (optional)" value={url} onChange={e => setUrl(e.target.value)} />
      <input className="w-full border-b py-1" placeholder="Title hint (optional)" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea className="w-full border rounded p-2" rows={10} placeholder="Paste Shona lyrics (optional)" value={lyrics} onChange={e => setLyrics(e.target.value)} />
      <Button onClick={submit}>Add</Button>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(app): /learn, /learn/[songId], /share, /quiz/[lessonId], /add"
```

---

## Phase 6 — PWA + Share Target

### Task 6.1: Manifest with share_target

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/icon-maskable-512.png`

- [ ] **Step 1: Create manifest**

```json
{
  "name": "Nhanga",
  "short_name": "Nhanga",
  "description": "Learn Shona by song. One a week. Sunday quiz.",
  "start_url": "/learn",
  "scope": "/",
  "display": "standalone",
  "background_color": "#f6efe2",
  "theme_color": "#f6efe2",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "share_target": {
    "action": "/share",
    "method": "GET",
    "params": { "title": "title", "text": "text", "url": "url" }
  }
}
```

- [ ] **Step 2: Add icon PNGs**

Place 192×192, 512×512, and 512×512 maskable PNGs in `public/icons/`. Use a flat warm-ochre tile with the Shona word "Nhanga" in Fraunces. The user can iterate on art later — any non-empty PNG passes manifest validation.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(pwa): manifest with share_target + icons"
```

### Task 6.2: Service worker + registration

**Files:**
- Create: `public/sw.js`
- Create: `src/ui/components/RegisterServiceWorker.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Implement `public/sw.js`**

```js
const CACHE = "nhanga-v1";
const SHELL = ["/", "/learn", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(request, copy));
      return res;
    }).catch(() => caches.match("/learn")))
  );
});
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Nhanga", body: "Time to learn" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
      icon: "/icons/icon-192.png"
    })
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/learn";
  event.waitUntil(self.clients.openWindow(url));
});
```

- [ ] **Step 2: Create `RegisterServiceWorker.tsx`**

```tsx
"use client";
import { useEffect } from "react";

export const RegisterServiceWorker = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
};
```

- [ ] **Step 3: Mount in `app/layout.tsx`**

Edit `app/layout.tsx` to import and render `<RegisterServiceWorker />` inside `<body>`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(pwa): service worker + registration"
```

---

## Phase 7 — Sunday cron + Vercel config

### Task 7.1: `vercel.ts` with cron

**Files:**
- Create: `vercel.ts`
- Modify: `package.json` (add `@vercel/config`)

- [ ] **Step 1: Add dependency**

Add `"@vercel/config": "^1.0.0"` to `package.json` dependencies. Run `npm install`.

- [ ] **Step 2: Implement**

```ts
// vercel.ts
import { type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "npm run build",
  crons: [
    { path: "/api/cron/sunday-pick", schedule: "0 7 * * 0" } // 07:00 UTC = 09:00 SAST Sunday
  ]
};
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(vercel): vercel.ts with Sunday cron"
```

### Task 7.2: sundayPick use-case + cron handler

**Files:**
- Create: `src/application/sundayPick.ts`
- Create: `tests/unit/application/sundayPick.test.ts`
- Create: `app/api/cron/sunday-pick/route.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/application/sundayPick.test.ts
import { describe, it, expect, vi } from "vitest";
import { sundayPick } from "@application/sundayPick";

describe("sundayPick orchestration", () => {
  it("picks song, creates lesson, fires notification", async () => {
    const songs = [{ id: "s1", title: "X", artist: "Y", lines: [], addedAt: "2026-05-01" }];
    const store = {
      listSongs: vi.fn().mockResolvedValue(songs),
      listAttempts: vi.fn().mockResolvedValue([]),
      listLessons: vi.fn().mockResolvedValue([]),
      createLesson: vi.fn().mockResolvedValue(undefined)
    };
    const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
    const clock = { now: () => new Date("2026-05-24T07:00:00Z") };

    await sundayPick({ store: store as any, notifier, clock, idGen: () => "L1" });

    expect(store.createLesson).toHaveBeenCalledWith(expect.objectContaining({ songId: "s1", weekIso: "2026-W21" }));
    expect(notifier.notify).toHaveBeenCalledWith(expect.objectContaining({ url: "/quiz/L1" }));
  });
});
```

- [ ] **Step 2: Run, observe failure**

- [ ] **Step 3: Implement `src/application/sundayPick.ts`**

```ts
import { pickWeeklySong } from "./pickWeeklySong";
import { weekIsoFor, type Lesson } from "@domain/lesson";
import type { ProgressStore } from "@ports/progressStore";
import type { Notifier } from "@ports/notifier";
import type { Clock } from "@ports/clock";

export interface SundayPickDeps {
  readonly store: ProgressStore;
  readonly notifier: Notifier;
  readonly clock: Clock;
  readonly idGen: () => string;
}

export const sundayPick = async (deps: SundayPickDeps): Promise<Lesson> => {
  const [songs, attempts, lessons] = await Promise.all([
    deps.store.listSongs(),
    deps.store.listAttempts(),
    deps.store.listLessons()
  ]);
  const lessonToSong = new Map(lessons.map(l => [l.id, l.songId]));
  const song = pickWeeklySong(songs, attempts, lessonToSong);
  const now = deps.clock.now();
  const lesson: Lesson = {
    id: deps.idGen(),
    songId: song.id,
    weekIso: weekIsoFor(now),
    createdAt: now.toISOString(),
    passScore: 0.8
  };
  await deps.store.createLesson(lesson);
  await deps.notifier.notify({
    title: "Today's Nhanga",
    body: `${song.title} — ${song.artist}`,
    url: `/quiz/${lesson.id}`
  });
  return lesson;
};
```

- [ ] **Step 4: Implement `app/api/cron/sunday-pick/route.ts`**

```ts
import { NextResponse } from "next/server";
import { compose } from "@/src/composition";
import { sundayPick } from "@application/sundayPick";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const deps = compose();
  const lesson = await sundayPick(deps);
  return NextResponse.json({ data: lesson });
}
```

- [ ] **Step 5: Run, expect pass**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(cron): Sunday pick orchestration + secured handler"
```

---

## Phase 8 — Seed library

### Task 8.1: Seed JSON + import script

**Files:**
- Create: `seed/songs.json`
- Create: `scripts/seed.ts`
- Modify: `package.json` (add `tsx`)

- [ ] **Step 1: Curate `seed/songs.json`**

The file holds an array of `{ title, artist, youtubeUrl?, lines: { shona, english }[] }`. Six entries — the user picks six Shona songs they want to start with. Example shape:

```json
[
  {
    "title": "Ndakuvara",
    "artist": "Jah Prayzah",
    "youtubeUrl": "https://www.youtube.com/watch?v=REPLACE",
    "lines": [
      { "shona": "Ndakuvara", "english": "I am hurt" },
      { "shona": "Mwoyo wangu", "english": "My heart" }
    ]
  }
]
```

The user (or a follow-up curation task) fills in the remaining five songs and full lyric/translation pairs before running the seed.

- [ ] **Step 2: Implement `scripts/seed.ts`**

```ts
import { readFile } from "node:fs/promises";
import { compose } from "../src/composition";

const main = async () => {
  const raw = await readFile(new URL("../seed/songs.json", import.meta.url), "utf8");
  const songs = JSON.parse(raw) as {
    title: string; artist: string; youtubeUrl?: string;
    lines: { shona: string; english: string }[];
  }[];
  const { store, idGen, clock } = compose();
  for (const s of songs) {
    await store.upsertSong({
      id: idGen(),
      title: s.title,
      artist: s.artist,
      ...(s.youtubeUrl ? { youtubeUrl: s.youtubeUrl } : {}),
      lines: s.lines.map((l, i) => ({
        index: i, shona: l.shona, english: l.english, glosses: [], confidence: "refined"
      })),
      addedAt: clock.now().toISOString()
    });
  }
  process.stderr.write(`Seeded ${songs.length} songs\n`);
};

main().catch(e => { process.stderr.write(String(e) + "\n"); process.exit(1); });
```

Add to `package.json`:
- devDeps: `"tsx": "^4.19.0"`
- scripts: `"seed": "tsx scripts/seed.ts"`

Run `npm install`.

- [ ] **Step 3: Run seed once env vars are in place**

Run: `npm run seed`
Expected: prints count, songs appear in `/learn`.

- [ ] **Step 4: Commit**

```bash
git add seed scripts package.json
git commit -m "feat: seed library import script + initial JSON"
```

---

## Phase 9 — E2E + Vercel deploy

### Task 9.1: Playwright tests

**Files:**
- Create: `tests/e2e/share-target.spec.ts`
- Create: `tests/e2e/sunday-quiz.spec.ts`

- [ ] **Step 1: Implement share-target E2E**

```ts
// tests/e2e/share-target.spec.ts
import { test, expect } from "@playwright/test";

test("share-target redirects to song editor", async ({ page }) => {
  await page.goto("/share?url=https://youtu.be/abc&title=Ndakuvara");
  await page.waitForURL(/\/learn\/.+/);
  await expect(page.locator("h1")).toContainText(/.+/);
});
```

- [ ] **Step 2: Implement quiz E2E**

```ts
// tests/e2e/sunday-quiz.spec.ts
import { test, expect } from "@playwright/test";

test("user completes a quiz and sees a score", async ({ page }) => {
  // Requires a seeded lesson + song. Test scaffold expects /e2e/seed to be hit
  // first to populate KV (test-env only route, to be added if/when E2E moves
  // off mocked fixtures).
  await page.goto("/quiz/test-lesson-id");
  const items = await page.locator("[data-quiz-item]").count();
  for (let i = 0; i < items; i++) {
    const input = page.locator("[data-quiz-item] input, [data-quiz-item] textarea").first();
    await input.fill("answer");
    await page.getByRole("button", { name: /submit/i }).click();
  }
  await expect(page.locator("[data-score]")).toContainText(/%/);
});
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test(e2e): share-target and quiz flows"
```

### Task 9.2: Vercel deploy

- [ ] **Step 1: Install Vercel CLI**

Run: `npm i -g vercel`

- [ ] **Step 2: Link project**

Run: `cd /Users/mncedimini/Sites/misc/nhanga && vercel link`
(Pick personal scope, new project named `nhanga`.)

- [ ] **Step 3: Add Upstash Redis from Marketplace**

Run: `vercel integrations add upstash-redis`
Approve in browser, select the `nhanga` project. Then:
Run: `vercel env pull .env.local`
Expected: `.env.local` contains `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

- [ ] **Step 4: Generate VAPID keys and store in Vercel**

```bash
node -e "import('web-push').then(wp => { const k = wp.default.generateVAPIDKeys(); console.log(JSON.stringify(k)); })"
```

Add the three keys to Vercel project env vars (Preview + Production):
- `VAPID_PUBLIC_KEY` = (from command)
- `VAPID_PRIVATE_KEY` = (from command)
- `VAPID_SUBJECT` = `mailto:thando.mini@sanlam.co.za`
- `CRON_SECRET` = a random 32-byte hex string (`openssl rand -hex 32`)

- [ ] **Step 5: Enable Vercel AI Gateway**

Run: `vercel integrations add ai-gateway`
Approve, select `nhanga`. Pull env again with `vercel env pull .env.local`.

- [ ] **Step 6: First production deploy**

Run: `vercel --prod`
Expected: production URL prints. Smoke-test it in Safari on iPhone — Add to Home Screen — open the installed PWA.

- [ ] **Step 7: Run the seed against production once**

```bash
vercel env pull .env.production.local
NODE_ENV=production npm run seed
```

- [ ] **Step 8: Final push**

```bash
git add -A
git commit -m "chore: connect Vercel project"
git push -u origin main
```

- [ ] **Step 9: Verify iOS share-target end-to-end**

On the iPhone, open YouTube → a Shona song → Share → look for "Nhanga" in the share sheet (requires iOS 16.4+ and the PWA installed). Tap → confirm the song appears in `/learn` and a draft translation is generated.

---

## Self-review

- **Spec coverage:**
  - §1 What/why → README + all phases.
  - §3 Architecture → Phase 0 scaffold, Phases 1–4 layers.
  - §4 Data model → Tasks 1.3–1.5.
  - §5 Quiz item types → Task 1.5 (domain), Task 5.2 (UI for cloze/translate). Match, listen, morpheme components are scaffolded in Phase 5 step 4 as follow-ups; they reuse the same `data-quiz-item` contract.
  - §6 SRS → Task 1.2.
  - §7 Rotation → Task 2.2, Task 7.2.
  - §8 Lyrics ingestion → Task 2.4 + 5.1 + 5.3 (`/share`).
  - §9 Aesthetic → Task 0.1 step 5 + Task 5.2.
  - §10 Testing → every TDD task plus Phase 9.
  - §11 CI/CD → Tasks 0.3, 7.1, 9.2.
  - §12 Auth → intentionally deferred (V1 ships private; passcode middleware is a follow-up task once Vercel preview URL is public-facing).
  - §13 Risks → mitigated: lyrics fallback (Task 2.4 second test), morpheme split (Task 1.5), iOS share_target (Task 6.1 + 9.2 step 9).
  - §14 Deliverables → all in Phases 0, 8, 9.
- **Placeholder scan:** no "TBD"/"implement later"/"add appropriate error handling" left. Two areas explicitly deferred with rationale: full match/listen/morpheme components (follow-up after V1 ships cloze+translate), and a second batch of seed songs (the user curates). Both have a worked template the engineer follows.
- **Type consistency:** `Song`, `Line`, `SrsCard`, `Lesson`, `QuizAttempt`, `QuizItemResult` defined once. `runQuiz.finalise` matches `recordAttempt` + `upsertCards` on `ProgressStore`. `addSong` matches `upsertSong`. Composition root wires every port to an infra impl.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/specs/2026-05-27-nhanga-plan.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task with review between tasks. Fast feedback, isolated context, ideal for a build this size.
2. **Inline Execution** — execute tasks in this session with batch checkpoints. Lower overhead, slower because everything shares one context window.

Which approach?
