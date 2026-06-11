# Omniscience — Claude Code Project Brief

## What This App Does

Omniscience is a **Next.js academic knowledge taxonomy browser**. It lets users navigate all fields of human knowledge through a 4-level hierarchy:

```
Domain → L1 (field) → L2 (broad branches) → L3 (specific subfields)
```

**Domains and L1 are prefilled** (hardcoded seed data). **L2 and L3 are generated on-demand** by Claude via the Anthropic API — only when the user picks a field. Nothing is preloaded.

The user provides their own Anthropic API key (BYOK), stored in `localStorage` only — never sent to a server except as a passthrough to the Anthropic API.

---

## Live Deployment

- **Production URL:** https://omniscience-production.up.railway.app
- **GitHub:** https://github.com/praveenjay80-sudo/omniscience
- **Deployed on:** Railway
- **Deploy command:** `railway up --detach`

---

## Tech Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Anthropic SDK (`@anthropic-ai/sdk`) — streaming with `client.messages.stream()`
- Model: `claude-sonnet-4-6`, `max_tokens: 8192`, **no `thinking` parameter on any route**
- No database — all state in `localStorage` + React state
- No auth — BYOK model

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/taxonomy-seed.ts` | 13 prefilled domains with L1 arrays |
| `lib/searchUrls.ts` | 7 academic search link definitions |
| `lib/wikipedia.ts` | Wikipedia verification (batch, cached) |
| `app/page.tsx` | Main component — all navigation state lives here |
| `app/api/generate/route.ts` | Streams L2 or L3 JSON array from Claude |
| `app/api/explain/route.ts` | Streams beginner explanation from Claude |
| `app/api/prerequisites/route.ts` | Streams prerequisite chain + difficulty JSON |
| `app/api/studyplan/route.ts` | Streams 6-part Mastery Map curriculum with track system |
| `app/api/bookprereqs/route.ts` | Streams prerequisite works for a specific book/paper |
| `app/api/discover/route.ts` | All Discover features — dispatches by `feature` param |
| `app/api/decoder/route.ts` | Streams 6-section paper/book decoder (placement, prereqs, context) |
| `app/api/readingchain/route.ts` | Streams reading chain (generate or insert mode) |
| `components/SearchLinks.tsx` | Row of 7 academic search buttons |
| `components/VerifyBadge.tsx` | Wikipedia status badge (✓ / ? / ✗) |
| `components/ExplainModal.tsx` | Streaming explanation modal |
| `components/LearningPathModal.tsx` | Prerequisites + Study Plan modal (two tabs) |
| `components/DiscoverModal.tsx` | Two-panel discover modal |
| `components/UniversalMapModal.tsx` | The Map — 4-tab modal: Core Ideas, The Canon, Theoretical Minimum, Grand Questions |
| `components/ThematicModal.tsx` | Themes & Genealogy modal |
| `components/GreatQuestionsModal.tsx` | Great Questions modal |
| `components/DecoderModal.tsx` | Decoder modal — two-step: input form → streaming 6-section result |
| `components/ReadingChainModal.tsx` | Reading Chain modal — vertical card flow + place-a-paper input |
| `app/api/coreideas/route.ts` | Streams root ideas NDJSON for 4 resolution modes |
| `app/api/canon/route.ts` | Streams influential works NDJSON for a chosen sub-field |
| `app/api/thematic/route.ts` | Streams thematic analysis |
| `app/api/thematiccurriculum/route.ts` | Streams cross-field curriculum for a theme/idea |
| `app/api/genealogy/route.ts` | Streams thinker genealogy |
| `app/api/greatquestions/route.ts` | Streams list of great questions for a field |
| `app/api/greatquestion/route.ts` | Streams deep treatment of a single question |
| `app/api/universalquestions/route.ts` | Streams grand questions spanning all fields |
| `app/api/theoreticalminimum/route.ts` | Streams the irreducible gatekeeper sequence |
| `lib/taxonomy-l2.ts` | L2_SEED — Record<domain, Record<l1, string[]>> for sub-field dropdowns |

---

## Navigation State Machine

`app/page.tsx` drives everything with a `phase` state:

```
pick-domain → pick-l1 → pick-l2 → view-l3
```

**Critical race condition fix:** `expandGenRef = useRef(0)` — a generation counter incremented on every navigation. Any async `expand()` call checks `expandGenRef.current !== myGen` before writing state. Stale completions bail out silently. **Do not remove this pattern.**

---

## Streaming Architecture

Every API route follows the same pattern — **do not deviate from this**:

```typescript
const stream = new ReadableStream({
  async start(controller) {
    // Keep-alive byte: prevents Railway proxy from closing idle connections
    // during Anthropic's processing delay. Must be first.
    controller.enqueue(encoder.encode(" "));
    try {
      const anthropicStream = await client.messages.stream({ ... });
      for await (const chunk of anthropicStream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    } catch (err) { ... }
  },
});
return new Response(stream, {
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",  // prevents proxy buffering
    "X-Accel-Buffering": "no",                  // tells nginx not to buffer
  },
});
```

**Why thinking is disabled:** `thinking: { type: "adaptive" }` adds 10–20s of silence before the first token, which causes Railway's proxy to close the idle connection. Do not re-add it.

**Why the keep-alive byte:** fetch() itself throws "Failed to fetch" if the proxy closes the connection before a single byte is received. Writing `" "` immediately keeps the connection alive through Anthropic's initial processing delay.

---

## localStorage Cache Keys

| Key pattern | Stores |
|-------------|--------|
| `omni_apikey` | User's API key |
| `omni_l2::domain::l1` | Generated L2 array (JSON) |
| `omni_l3::domain::l1::l2` | Generated L3 array (JSON) |
| `omni_wiki::term` | Wikipedia result `{status, url}` (JSON) |
| `omni_prereq::domain::l1::l2::term` | Prerequisite chain + difficulty (JSON) |
| `omni_plan::domain::l1::l2::term::hours::background::goal::learningStyle::depth` | Full study plan markdown (up to 6 parts, cached per depth) |
| `omni_decoder::${normalizedTitle}` | Decoder result for a paper/book (title normalized to lowercase_underscore) |
| `omni_chain::domain::l1::l2::term` | Reading chain markdown for a topic |
| `omni_discover::domain::l1::l2::term::feature` | Discover modal result |
| `omni_discover::domain::l1::l2::term::feature::param` | Discover result (param features) |
| `omni_bookmarks` | JSON array of bookmarked topic strings |
| `omni_coreideas::${resolution}` | Core Ideas per resolution (questions/concepts/methods/findings) |
| `omni_canon::${domain}::${l1}::${l2}` | Canon works for a chosen sub-field (CanonWork[] JSON) |
| `omni_canon_read` | JSON array of read work titles (across all sub-fields) |
| `omni_curriculum::${idea.name.toLowerCase()}` | Cross-field curriculum for a Core Idea |
| `omni_universalquestions` | Grand Questions markdown |
| `omni_theoreticalminimum` | Theoretical Minimum markdown |

The **Reset Cache** button clears all `omni_l2::`, `omni_l3::`, `omni_wiki::`, `omni_prereq::`, `omni_plan::`, `omni_discover::`, `omni_wound::`, `omni_decoder::`, `omni_chain::` keys.

---

## API Routes

### `POST /api/generate`
Body: `{ apiKey, domain, l1, l2? }`
- If `l2` absent → generates L2 broad branches
- If `l2` present → generates L3 specific subfields
- Returns: streaming raw JSON array of strings
- **Critical prompt rule:** L2 = broad branches ONLY, L3 = specific named subfields. Do NOT let them mix.

### `POST /api/explain`
Body: `{ apiKey, term, domain, l1, l2? }`
- Streams a 5-section beginner explanation

### `POST /api/prerequisites`
Body: `{ apiKey, term, domain, l1, l2? }`
- Returns streaming JSON:
```json
{
  "difficulty": { "depth": 7, "estimatedMonths": 24, "level": "Graduate", "hoursTotal": 2400 },
  "chain": [
    { "name": "Set Theory", "why": "...", "months": 2 },
    { "name": "TARGET_TERM", "why": "Target field", "months": 0 }
  ]
}
```
- Extract JSON with `text.indexOf("{")` / `text.lastIndexOf("}")` — Claude may emit text before the JSON.

### `POST /api/studyplan`
Body: `{ apiKey, term, domain, l1, l2?, hoursPerWeek, background, goal, learningStyle, depth, part, coveredTitles[] }`

Generates the **Mastery Map** — a 6-part personalised curriculum with a track system. `depth` controls how many parts are generated: `foundation`=2, `working`=3, `research`=5, `complete`=6.

**Track system:** `goal` maps to a track that shapes resource selection from Level 3 onward:
- `"Academic mastery"` → `RESEARCH` (theoretical rigour, math foundations, opens research directions)
- `"Build job skills"` → `PRACTITIONER` (applied works, production implementations, professional practice)
- anything else → `EXPLORER` (synthesis, cross-disciplinary, conceptual breadth)

| Part | Content |
|------|---------|
| 1 | Field Orientation (3 paragraphs) + Your Path (track-aware) + Levels 0–1 + `#### MILESTONE: FIRST CONTACT` |
| 2 | Level 2 + `#### MILESTONE: FOUNDATION COMPLETE` + `#### FOUNDATION PRACTICE` (3 concrete tasks) |
| 3 | Specialisations map + `## The Great Debates` (4–6 debates with `#### DEBATE: [NAME]`) + Level 3 track-aware |
| 4 | Level 4 + Level 5 + `#### MILESTONE: RESEARCH READY` |
| 5 | Level 6 + The Three That Define + `## Tacit Knowledge` (4–6 unwritten expert knowledge) |
| 6 | Deep Themes (4–6) + The Horizon (aporia + metaphor + works from any era/language) |

**Resource format:** `### Title — Author(s) (Year) · TAG` where TAG is `CORE`, `ESSENTIAL`, or `OPTIONAL`. Part 6 receives `coveredTitles = []` so themes/horizon can reference curriculum works freely.

**Deduplication:** `coveredTitles[]` carries all `### Title —` headers from prior parts. Accumulated via `extractTitles(text)` (regex `^### .+$`). Part 6 intentionally skips deduplication.

**filterPlanText fix:** `####` lines (milestones, debates) must reset `skip = false` — they were silently hidden when a previous OPTIONAL block set `skip = true`. This is already fixed; do not revert.

**Loop-based fetchStudyPlan:** Uses `for (let p = 1; p <= limit; p++)` with `const prev = [...parts]` closure snapshot so in-progress streaming displays correctly alongside completed parts.

### `POST /api/bookprereqs`
Body: `{ apiKey, title, term, domain, l1 }`
- Given a specific book/paper title, streams its direct prerequisites
- Format: `**Title — Author (Year)** [TAG]: one sentence on what it provides`
- Used by the ↳ prereqs toggle on each resource in the Study Plan tab

### `POST /api/decoder`
Body: `{ apiKey, title, abstract? }`
- Streams a 6-section paper/book decoder — curriculum placement, prerequisites, intellectual context
- Sections: `## PLAIN LANGUAGE SUMMARY` → `## CURRICULUM PLACEMENT` → `## WHAT YOU NEED FIRST` → `## WHAT IT RESPONDED TO` → `## WHAT IT OPENED UP` → `## READINESS CHECK`
- `## CURRICULUM PLACEMENT` always emits `**Field:** Domain → L1 → L2` — this is parsed by `extractPlacement()` in DecoderModal to populate the "View Reading Chain →" button
- `max_tokens: 4096`

### `POST /api/readingchain`
Body: `{ apiKey, term, domain, l1, l2?, mode, insertTitle?, existingChain? }`
- `mode: "generate"` — streams a linear reading chain for the topic; no length cap, let subject determine depth
- `mode: "insert"` — places `insertTitle` into `existingChain`; returns `**Fits between:** A → B` + `**Why here:**` + the new chain entry in standard format
- Entry format: `### Title — Author(s) (Year)` + optional `· Language` + `**Requires:**` + `**Contributes:**` + `**Enables:**`; entries separated by `\n---\n`
- `max_tokens: 8192`

---

## LearningPathModal — Study Plan Tab (Mastery Map)

The 5-field intake form (rebuilt):
1. **Depth** — 2×2 card grid: Foundation (2 parts) / Working Knowledge (3 parts) / Research Depth (5 parts) / Complete Mastery (6 parts, recommended badge)
2. **Current level** — 4 cards: No background / Level 1–2 basics / Working knowledge / Advanced graduate
3. **Goal** — 4 cards that show track name: Explorer / Practitioner / Research (maps to `EXPLORER`/`PRACTITIONER`/`RESEARCH` track)
4. **Hours/week** — compact row: 5h / 10h / 20h / 40h + custom input
5. **Learning style** — compact row: Reading / Videos / Building / Mix

Button: "Build My Mastery Map →", disabled until all 5 selected.

**Loop-based chaining in `fetchStudyPlan()`:**
```typescript
const depthParts = { foundation: 2, working: 3, research: 5, complete: 6 };
const limit = depthParts[depth] ?? 6;
for (let p = 1; p <= limit; p++) {
  const coveredForThisPart = p === 6 ? [] : [...allTitles];
  const prev = [...parts]; // closure snapshot for streaming display
  const current = await streamPart(p, coveredForThisPart, (t) => {
    setPlanText([...prev, t].join(sep));
  });
  parts.push(current);
  if (p < limit) allTitles.push(...extractTitles(current));
}
```

**Cache key:** `omni_plan::domain::l1::l2::term::hours::background::goal::learningStyle::depth` — each depth is a separate cache entry.

**Per-resource prereq button:** Each `### ` heading in `renderMarkdown` renders a `↳ prereqs` button. Clicking fetches `/api/bookprereqs` for that title, streams the result inline beneath the heading, and caches it in `bookPrereqs` state (Record<string, string>). `expandedBooks` (Set<string>) tracks which are open. Toggle = click again to collapse.

**Tag parsing in `renderMarkdown`:** The `### ` case strips ` · TAG` from the display title and renders it as a colored badge:
- CORE → red (`bg-red-900/60 text-red-300`)
- ESSENTIAL → blue (`bg-blue-900/60 text-blue-300`)
- OPTIONAL → gray (`bg-gray-800 text-gray-400`)

**filterPlanText:** Hides OPTIONAL resource descriptions unless "All works" filter is selected. CRITICAL: `#### ` lines (milestones, debates) must reset `skip = false` — do not remove this or milestones will be hidden.

---

## Known Design Decisions & Gotchas

- **Scroll:** outer div must be `h-screen overflow-hidden`, `<main>` must be `overflow-y-auto`. `min-h-screen` breaks scrolling.
- **L2 vs L3 granularity:** prompts in `/api/generate` have explicit correct/wrong examples. Keep them — Claude defaults to round numbers and wrong granularity without them.
- **Talpa Books URL:** uses `+` for spaces, not `%20`.
- **Wikipedia cache backward compat:** old entries are plain strings; new format is `JSON.stringify({status, url})`. Parse has a try/catch fallback.
- **Study plan cache:** old plans generated before the 6-part Mastery Map rebuild won't have the track system, depth, or new sections. Users must clear `omni_plan::` keys from localStorage to regenerate.
- **Reading chain parser:** `parseChain()` splits on `\n---\n` and extracts `### Title — Author (Year)` + optional `· Language` on same line + `**Requires:**`/`**Contributes:**`/`**Enables:**` fields. The language can also appear as a standalone `· Language` line — parser handles both positions.
- **Decoder placement extraction:** `extractPlacement()` regex matches `**Field:** Domain → L1 → L2` with `[→›>/]` as separator. Returns `{ term, domain, l1, l2? }` — `term` is the last segment of the field path.

---

## Feature List (current)

### Taxonomy Browser
1. **Taxonomy browser** — Domain → L1 → L2 → L3 navigation
2. **On-demand generation** — L2/L3 generated by Claude, cached in localStorage
3. **7 academic search links** per card — Scholar, Semantic Scholar ↑cited, OpenAlex ↑cited, CORE, Inciteful, Talpa Books, WorldCat ↑loaned
4. **Explain Me** — streaming beginner explanation modal
5. **Wikipedia verification** — batch badges (✓/✗/?), batches of 6 with 150ms pause
6. **↗ Study Plan modal** — two tabs:
   - **Prerequisites:** ordered chain with time estimates + difficulty summary
   - **Mastermind Study Plan:** 4-question profile → 7-level exhaustive literature curriculum (4 API parts), each resource tagged CORE/ESSENTIAL/OPTIONAL with a ↳ prereqs inline expander
7. **Bookmarks** — ☆ star any card, stored in `omni_bookmarks`
8. **Difficulty badges** — colored level pill on cards with cached prereq data
9. **Discover modal** — 26 features across 5 groups (UNDERSTAND / WORKS / EXPLORE / CONNECT / TEST YOURSELF)
10. **Reset Cache** — clears all generated localStorage data

### The Map (UniversalMapModal — prime hero feature)
11. **Core Ideas** — 4 categorically distinct lenses (Root Questions / Concepts / Methods / Findings). Each produces a genuinely different NDJSON stream of intellectual roots, cached per resolution. Clicking any root opens a cross-field curriculum view.
12. **The Canon** — Domain → Field → Sub-field 3-level selector (from TAXONOMY_SEED + L2_SEED). Generates 20–35 most influential works for the chosen sub-field, sorted Intro→UG→Grad→Research. Level-colored left-border on each card. Type icon (Textbook/Monograph/Paper/Classic). Filter by level + type + search. Read tracking persisted in `omni_canon_read`.
13. **Theoretical Minimum** — The irreducible gatekeeper concept sequence in strict dependency order, spanning all fields.
14. **Grand Questions** — The deepest cross-disciplinary questions no single field can answer.
- All 4 tabs: Sonnet/Haiku model toggle + Stop button (AbortController pattern).

### Supporting Features
15. **Themes & Genealogy** (ThematicModal) — surface 40+ themes in any field; trace thinker genealogy
16. **Great Questions** (GreatQuestionsModal) — deep dive into the great questions of any field
17. **⊙ The Horizon** (WoundModal) — structural limit of any field: Central Aporia + Load-Bearing Metaphor + Works from any era/language. Button on every L2/L3 card. Cache: `omni_wound::`.
18. **⬡ The Decoder** (DecoderModal) — paste any paper/book title + optional abstract → 6-section analysis: placement, prereqs, context, what it opened, readiness check. "View Reading Chain →" button auto-places paper in chain. Cache: `omni_decoder::`.
19. **⬦ Reading Chain** (ReadingChainModal) — linear reading spine from first contact to mastery, no length cap. "Place a paper" input to find where any work fits (amber-highlighted card). Auto-placement if opened from Decoder. Cache: `omni_chain::`. Button on every L2/L3 card.

---

## How to Run Locally

```bash
npm install
npm run dev   # starts on http://localhost:3000
```

No `.env` needed — API key is entered by the user in the UI.

---

## How to Add a New Feature

1. New Claude feature → add `app/api/<name>/route.ts`, copy streaming pattern exactly (keep-alive byte + anti-buffering headers + no thinking)
2. New modal → copy `LearningPathModal.tsx` as template
3. New button → add to the L2/L3 card button row in `app/page.tsx`
4. New cache key prefix → add to the Reset Cache filter in `app/page.tsx`
5. Deploy: `railway up --detach`

---

## Model Note

All routes use `claude-sonnet-4-6` as default. The Map modal routes (coreideas, canon, thematic, thematiccurriculum, genealogy, greatquestions, greatquestion, universalquestions, theoreticalminimum) also accept a `model` param from the UI's Sonnet/Haiku toggle:
```typescript
model: (reqModel === "claude-haiku-4-5-20251001" ? reqModel : "claude-sonnet-4-6") as ...
```

Core taxonomy routes to update for a model upgrade:
- `app/api/generate/route.ts`
- `app/api/explain/route.ts`
- `app/api/prerequisites/route.ts`
- `app/api/studyplan/route.ts`
- `app/api/bookprereqs/route.ts`
- `app/api/discover/route.ts`

Latest model IDs: https://docs.anthropic.com/en/docs/about-claude/models
