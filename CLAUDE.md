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
| `app/api/studyplan/route.ts` | Streams exhaustive literature curriculum (4-part) |
| `app/api/bookprereqs/route.ts` | Streams prerequisite works for a specific book/paper |
| `app/api/discover/route.ts` | All Discover features — dispatches by `feature` param |
| `components/SearchLinks.tsx` | Row of 7 academic search buttons |
| `components/VerifyBadge.tsx` | Wikipedia status badge (✓ / ? / ✗) |
| `components/ExplainModal.tsx` | Streaming explanation modal |
| `components/LearningPathModal.tsx` | Prerequisites + Study Plan modal (two tabs) |
| `components/DiscoverModal.tsx` | Two-panel discover modal |
| `components/UniversalMapModal.tsx` | The Map — 4-tab modal: Core Ideas, The Canon, Theoretical Minimum, Grand Questions |
| `components/ThematicModal.tsx` | Themes & Genealogy modal |
| `components/GreatQuestionsModal.tsx` | Great Questions modal |
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
| `omni_plan::domain::l1::l2::term::hours::background::goal::learningStyle` | Full study plan markdown (all 4 parts) |
| `omni_discover::domain::l1::l2::term::feature` | Discover modal result |
| `omni_discover::domain::l1::l2::term::feature::param` | Discover result (param features) |
| `omni_bookmarks` | JSON array of bookmarked topic strings |
| `omni_coreideas::${resolution}` | Core Ideas per resolution (questions/concepts/methods/findings) |
| `omni_canon::${domain}::${l1}::${l2}` | Canon works for a chosen sub-field (CanonWork[] JSON) |
| `omni_canon_read` | JSON array of read work titles (across all sub-fields) |
| `omni_curriculum::${idea.name.toLowerCase()}` | Cross-field curriculum for a Core Idea |
| `omni_universalquestions` | Grand Questions markdown |
| `omni_theoreticalminimum` | Theoretical Minimum markdown |

The **Reset Cache** button clears all `omni_l2::`, `omni_l3::`, `omni_wiki::`, `omni_prereq::`, `omni_plan::`, `omni_discover::` keys.

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
Body: `{ apiKey, term, domain, l1, l2?, hoursPerWeek, background, goal, learningStyle, part, coveredTitles[] }`

Generates an exhaustive 7-level literature curriculum in **4 sequential parts**:

| Part | Levels | Content |
|------|--------|---------|
| 1 | 0, 1, 2 | Prerequisites → First Contact → Foundation |
| 2 | 3, 4 | Working Knowledge → Advanced Depth |
| 3 | 5 | The Papers Everyone Cites (seminal papers only) |
| 4 | 6 + Canon | Research Frontier + The Three That Define the Field |

**Resource format:** Each resource uses `### Title — Author(s) (Year) · TAG` where TAG is `CORE`, `ESSENTIAL`, or `OPTIONAL`.

**Deduplication:** `coveredTitles[]` is a list of all `### Title —` header strings from prior parts. Each part's prompt includes a `CRITICAL — do NOT include` block listing them. The frontend calls `extractTitles(text)` (regex on `^### .+$`) after each part and passes the accumulated list to the next.

**Why 4 parts:** 8192 tokens per part. Rich fields overflow a single-part budget; splitting ensures no level is cut. Level 5 (seminal papers) gets its own part because it can easily fill 8192 tokens alone.

### `POST /api/bookprereqs`
Body: `{ apiKey, title, term, domain, l1 }`
- Given a specific book/paper title, streams its direct prerequisites
- Format: `**Title — Author (Year)** [TAG]: one sentence on what it provides`
- Used by the ↳ prereqs toggle on each resource in the Study Plan tab

---

## LearningPathModal — Study Plan Tab

The 4-question intake form:
- Background: Complete beginner / Know the basics / Have some experience
- Goal: Understand conceptually / Build job skills / Academic mastery / Satisfy curiosity
- Hours/week: preset buttons (5/10/20/40) + custom number input
- Learning style: Reading books / Watching videos / Building things / Mix of everything

The "Build My Mastermind Plan →" button is disabled until all 4 are selected.

**4-part chaining in `fetchStudyPlan()`:**
```typescript
const part1 = await streamPart(1, [], ...);
const titles1 = extractTitles(part1);
const part2 = await streamPart(2, titles1, ...);
const titles2 = [...titles1, ...extractTitles(part2)];
const part3 = await streamPart(3, titles2, ...);
const titles3 = [...titles2, ...extractTitles(part3)];
const part4 = await streamPart(4, titles3, ...);
```

**Per-resource prereq button:** Each `### ` heading in `renderMarkdown` renders a `↳ prereqs` button. Clicking fetches `/api/bookprereqs` for that title, streams the result inline beneath the heading, and caches it in `bookPrereqs` state (Record<string, string>). `expandedBooks` (Set<string>) tracks which are open. Toggle = click again to collapse.

**Tag parsing in `renderMarkdown`:** The `### ` case strips ` · TAG` from the display title and renders it as a colored badge:
- CORE → red (`bg-red-900/60 text-red-300`)
- ESSENTIAL → blue (`bg-blue-900/60 text-blue-300`)
- OPTIONAL → gray (`bg-gray-800 text-gray-400`)

---

## Known Design Decisions & Gotchas

- **Scroll:** outer div must be `h-screen overflow-hidden`, `<main>` must be `overflow-y-auto`. `min-h-screen` breaks scrolling.
- **L2 vs L3 granularity:** prompts in `/api/generate` have explicit correct/wrong examples. Keep them — Claude defaults to round numbers and wrong granularity without them.
- **Talpa Books URL:** uses `+` for spaces, not `%20`.
- **Wikipedia cache backward compat:** old entries are plain strings; new format is `JSON.stringify({status, url})`. Parse has a try/catch fallback.
- **Study plan cache:** old plans generated before the 4-part split or before TAG format was added won't have tags or all levels. Users must clear `omni_plan::` keys from localStorage to regenerate.

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
