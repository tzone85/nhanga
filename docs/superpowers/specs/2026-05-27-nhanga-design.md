# Nhanga — Design Spec

**Status:** Approved (2026-05-27)
**Author:** Thando Mini
**Implementation plan:** `docs/superpowers/specs/2026-05-27-nhanga-plan.md` (next, via writing-plans skill)

---

## §1 What and why

A personal Progressive Web App for learning Shona through music. One curated song per week, Sunday quiz, spaced repetition across weeks. Target: 80% score on the weekly quiz, with both receptive (listen → meaning) and productive (English → Shona) fluency on each week's vocabulary.

The name **Nhanga** comes from the traditional Shona gathering hut where elders taught the young. The app is a small digital version of that.

### Non-goals

- Multi-user platform. V1 is single-user. The schema leaves a `userId` seam so a second user can be bolted on later without migration.
- General Bantu language coverage. V1 is Shona only.
- Replacing a tutor. The app augments listening practice; it does not claim grammar-textbook completeness.

## §2 Approaches considered

| Option | Backend | Cross-device sync | Verdict |
|---|---|---|---|
| Pure-client PWA | None | No | Rejected — fails the "Mac + iPhone" promise once any line gets refined on one device |
| **PWA + thin server, single-user passcode** | Next.js routes + Vercel KV | Yes | **Chosen** |
| PWA + Supabase auth + RLS | Heavier | Yes, multi-user-ready | Premature for V1 |

The chosen option keeps the surface area small while supporting the genuine need (refining a translation on the Mac and quizzing on the iPhone the next day).

## §3 Architecture

Clean/Hexagonal. The dependency arrow only ever points inward: `infra → ports ← application → domain`. The presentation layer (Next.js `app/`) and React UI compose use-cases via a single dependency-injection root.

```
nhanga/
├── app/                       # Next.js 16 App Router (presentation)
│   ├── (marketing)/           # Public landing
│   ├── learn/                 # Library + lesson views
│   ├── share/                 # Share-target receiver
│   ├── quiz/[lessonId]/       # Sunday quiz session
│   └── api/                   # Thin route handlers → application
├── src/
│   ├── domain/                # Pure, framework-free
│   ├── application/           # Use-cases, orchestrate ports
│   ├── ports/                 # Interfaces (DI seams)
│   ├── infra/                 # Adapters implementing ports
│   ├── ui/                    # React components (presentational)
│   └── composition.ts         # DI root — wires infra → ports
├── tests/{unit,integration,e2e}/
├── public/{manifest.webmanifest, sw.js, icons/}
├── docs/superpowers/{specs,diagrams,decisions}/
└── mempalace.yaml
```

### Layer rules

- `domain/` imports nothing outside itself. No React, no Next, no I/O, no DOM, no clock — time is injected.
- `application/` imports only `domain/` and `ports/`.
- `infra/` imports `ports/` and external SDKs.
- `app/` and `ui/` import `application/` via `composition.ts`. They never reach into `infra/` directly.

The composition root is the single file that knows real adapters exist; tests replace it with fakes.

## §4 Data model

```ts
type Song = {
  id: string;                 // ulid
  title: string;
  artist: string;
  youtubeUrl?: string;
  lines: Line[];
  addedAt: string;            // ISO 8601
  lastQuizzedAt?: string;
};

type Line = {
  index: number;
  shona: string;
  english: string;
  glosses: Gloss[];
  confidence: 'draft' | 'refined';
  audioRange?: { startMs: number; endMs: number };
};

type Gloss = {
  shonaToken: string;
  englishGloss: string;
  morphemes?: string[];       // e.g. ['ndi','no','ku','da']
};

type Lesson = {
  id: string;
  songId: string;
  weekIso: string;            // ISO week, e.g. "2026-W22"
  createdAt: string;
  passScore: number;          // default 0.8
};

type QuizAttempt = {
  id: string;
  lessonId: string;
  startedAt: string;
  finishedAt?: string;
  items: QuizItemResult[];
  score?: number;
};

type SrsCard = {
  id: string;                 // line or gloss id
  kind: 'line' | 'gloss';
  ease: number;               // SM-2 default 2.5
  intervalDays: number;
  dueAt: string;
  lapses: number;
};

type QuizItemKind = 'cloze' | 'match' | 'translate' | 'listen' | 'morpheme';

type QuizItemResult = {
  cardId: string;
  kind: QuizItemKind;
  correct: boolean;
  answeredAt: string;
  userAnswer?: string;
};
```

All types are immutable. State transitions return new objects (`updateCard(card, result) → SrsCard`).

## §5 Quiz item types

Five types in a deliberate mix. Each Sunday quiz draws ~10 items: 6 from the week's song, 4 from SRS due cards across previous songs. Pass = ≥80% (`passScore`).

| Type | What it trains | Difficulty | Why it's in the set |
|---|---|---|---|
| Cloze | Recall in context | Medium | Backbone of Anki; strongest single technique for vocabulary |
| Match | Recognition | Easy | Warm-up; low retrieval cost |
| Translate-to-English (typed) | Productive recall | Hard | Roediger & Karpicke 2006: production > recognition for retention |
| Listen-and-pick (YouTube clip → meaning) | Auditory parsing | Medium | Schön 2008: music-mediated learning improves lexical recall vs spoken-only |
| Morpheme split (split `ndinokuda` into `ndi-no-ku-da`) | Decoding agglutinative grammar | Hardest | Bantu morphology demands this; word-for-word fails on it |

## §6 Spaced repetition

SM-2 lite. Pure function `schedule(card, grade, now) → SrsCard`. Injected clock.

```
on correct: interval = max(1, round(interval * ease)); ease = min(ease + 0.10, 3.0); dueAt = now + interval days
on wrong:   interval = 1;                              ease = max(ease - 0.20, 1.3); lapses += 1; dueAt = tomorrow
new card:   ease = 2.5; interval = 0; dueAt = today
```

## §7 Weekly rotation algorithm

```
pickWeeklySong(songs, attempts):
  unseen = songs.filter(s => no QuizAttempt has lessonId pointing at s)
  if unseen.length > 0:
    return unseen.sortBy(addedAt).first()           // FIFO unseen
  else:
    return songs.sortBy(latestAttemptScore(s)).first()
```

Vercel Cron at `0 7 * * 0` (07:00 UTC = 09:00 SAST Sunday) invokes `pickWeeklySong`, creates a `Lesson`, fires a web-push notification. Tapping deep-links to `/quiz/[lessonId]`.

## §8 Lyrics ingestion flow

iOS Share Sheet is the primary path. Manual paste is the fallback.

1. While playing on the YouTube iOS app, user taps Share → "Nhanga" (the installed PWA, registered via `share_target` in the manifest).
2. The PWA opens at `/share` with the URL pre-filled.
3. `addSong` use-case calls:
   - `VideoAdapter.fetchMetadata(url)` → title, artist (best guess), thumbnail, duration.
   - `LyricsSource.fetch(title, artist)` → Genius first, lyrics.ovh fallback, empty result is acceptable.
   - `Translator.draftTranslation(shonaLyrics)` → line-by-line English plus per-token glosses, via Vercel AI Gateway → Claude Sonnet 4.6.
4. UI shows an editor: every line is a row with Shona (read-only), English (editable), and glosses. Saving any edit sets `confidence: 'refined'` for that line.
5. On save, the Song is written through `ProgressStore` to Vercel KV.

Edits made on either device sync via KV — the device is just a window onto the same store.

## §9 Aesthetic

Palette is Zim-textile inspired. No purple, no violet, no gradients-into-pink.

| Token | Hex | Role |
|---|---|---|
| `--ndoro` (sacred white shell) | `#f6efe2` | Background |
| `--gora` (eagle, charcoal) | `#1f1d1c` | Ink |
| `--mwedzi` (moon ochre) | `#d99749` | Accent / CTAs |
| `--shavi` (deep clay) | `#8c3a26` | Headings / strong feedback |
| `--ruwa` (leaf) | `#4f6b35` | Correct state |
| `--mvura` (water-blue) | `#2e6f8c` | Links / progress |

Typography: **Fraunces** (display) + **Inter** (body). Motion: subtle drift, no shimmer or glow. Iconography: thin-stroke line icons, no gradient blobs.

## §10 Testing strategy

Test-driven, 80%+ coverage enforced in CI.

- **Unit** (vitest): `domain/srs`, `domain/quiz`, `application/pickWeeklySong`, `application/runQuiz`, immutability invariants. No I/O. Injected clock.
- **Integration** (vitest + msw): each adapter in `infra/` with HTTP mocked. Translator, lyrics, video metadata, KV store.
- **E2E** (Playwright): share-target receive → translate draft → refine → save; install-prompt; Sunday quiz pass and fail paths.

Pre-commit: lint + typecheck + unit only.

## §11 CI/CD and deployment

- GitHub Actions: `lint`, `typecheck`, `test:unit`, `test:integration`, `build` on PR. `test:e2e` on merge to `main`.
- Vercel preview deploy per PR; production on `main`.
- Cron declared in `vercel.ts` (not `vercel.json`).
- AI calls via Vercel AI Gateway — `provider/model` string, no provider-specific SDK lock-in.
- Web Push via VAPID keys stored in Vercel env vars.

## §12 Authentication (V1)

Single-user passcode. The PWA prompts once on first launch; the passcode hashes to a bearer token stored in `localStorage` and sent on every API request. No accounts, no email, no OAuth. Replaceable with a real auth provider when the second user appears.

## §13 Risks and open questions

- **Lyrics availability.** Shona songs are sparsely covered by Genius and lyrics.ovh. Acceptance: the AI translation draft must work even when the lyrics fetch returns empty — the user can type lines in directly.
- **AI translation quality on agglutinative morphology.** Mitigation: the morpheme-split quiz items force the user to break words down; refinements feed back into the stored glosses so the second-pass translation of a similar line uses the user's vocabulary.
- **iOS share_target reach.** Requires iOS 16.4+. The user is on a current iPhone — acceptable.
- **Single-user model.** If Nozi ever joins, schema gains a `userId` column; UI gains a sign-in screen. Cost is contained because the application layer never assumed singletons.

## §14 Deliverables for the first slice

1. This spec (committed).
2. SVG diagrams: architecture, share-to-quiz sequence, sunday-quiz sequence.
3. `mempalace.yaml` wing/rooms map.
4. Repo scaffold: Next.js 16, Tailwind v4, vitest, Playwright, GitHub Actions, Vercel config (`vercel.ts`).
5. First failing unit tests for `domain/srs` and `application/pickWeeklySong` (TDD red phase).
6. Push to GitHub under the user's account.

The implementation plan that follows this spec will sequence those deliverables into review-checkpointed phases.
