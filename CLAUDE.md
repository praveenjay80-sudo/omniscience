# Omniscience — Claude Code Project Brief

## What This App Does

Omniscience is a **Next.js academic knowledge taxonomy browser**. It lets users navigate all fields of human knowledge through a 4-level hierarchy:

```
Domain → L1 (field) → L2 (broad branches) → L3 (specific subfields)
```

**Domains and L1 are prefilled** (hardcoded seed data). **L2 and L3 are generated on-demand** by Claude Opus via the Anthropic API — only when the user picks a field. Nothing is preloaded.

The user provides their own Anthropic API key (BYOK), stored in `localStorage` only — never sent to a server except as a passthrough to the Anthropic API.

---

## Live Deployment

- **Production URL:** https://omniscience-production.up.railway.app
- **GitHub:** https://github.com/praveenjay80-sudo/omniscience
- **Deployed on:** Railway (auto-deploys from GitHub `master`)
- **Deploy command:** `railway up --detach`

---

## Tech Stack

- Next.js 14 App Router, TypeScript, Tailwind CSS
- Anthropic SDK (`@anthropic-ai/sdk`) — streaming with `client.messages.stream()`
- Model: `claude-opus-4-7` with `thinking: { type: "adaptive" }`, `max_tokens: 8192`
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
| `app/api/studyplan/route.ts` | Streams week-by-week study plan markdown |
| `app/api/discover/route.ts` | All 24 Discover features — dispatches to correct prompt by `feature` param |
| `components/SearchLinks.tsx` | Row of 7 academic search buttons |
| `components/VerifyBadge.tsx` | Wikipedia status badge (✓ / ? / ✗) |
| `components/ExplainModal.tsx` | Streaming explanation modal |
| `components/LearningPathModal.tsx` | Prerequisites + Study Plan modal (two tabs) |
| `components/DiscoverModal.tsx` | Two-panel discover modal: sidebar (24 features) + content pane |

---

## Navigation State Machine

`app/page.tsx` drives everything with a `phase` state:

```
pick-domain → pick-l1 → pick-l2 → view-l3
```

- `pick-domain`: grid of all 13 domains from seed data
- `pick-l1`: grid of L1 fields for the selected domain (from seed)
- `pick-l2`: generates L2 list via `/api/generate`, shows cards with search links + buttons
- `view-l3`: generates L3 list via `/api/generate` (passing `l2`), shows cards

**Critical race condition fix:** `expandGenRef = useRef(0)` — a generation counter incremented on every navigation. Any async `expand()` call checks `expandGenRef.current !== myGen` before writing state. Stale completions bail out silently. **Do not remove this pattern.**

---

## localStorage Cache Keys

| Key pattern | Stores |
|-------------|--------|
| `omni_apikey` | User's API key |
| `omni_l2::domain::l1` | Generated L2 array (JSON) |
| `omni_l3::domain::l1::l2` | Generated L3 array (JSON) |
| `omni_wiki::term` | Wikipedia result `{status, url}` (JSON) |
| `omni_prereq::domain::l1::l2::term` | Prerequisite chain + difficulty (JSON) |
| `omni_plan::domain::l1::l2::term::hours` | Study plan markdown string |
| `omni_discover::domain::l1::l2::term::feature` | Discover modal result for simple features |
| `omni_discover::domain::l1::l2::term::feature::param` | Discover result for param features (analogies/collision/compare) |
| `omni_bookmarks` | JSON array of bookmarked topic strings |

The **Reset Cache** button in the header clears all `omni_l2::`, `omni_l3::`, `omni_wiki::`, `omni_prereq::`, `omni_plan::` keys.

---

## API Routes

### `POST /api/generate`
Body: `{ apiKey, domain, l1, l2? }`
- If `l2` is absent → generates **L2 broad branches** (e.g. "Algebra", "Analysis" for Mathematics)
- If `l2` is present → generates **L3 specific subfields** (e.g. "Abstract Algebra", "Linear Algebra" for Algebra)
- Returns: streaming raw JSON array of strings
- **Critical prompt rule:** L2 = broad branches ONLY, L3 = specific named subfields. Do NOT let them mix.

### `POST /api/explain`
Body: `{ apiKey, term, domain, l1, l2? }`
- Streams a beginner explanation with sections: What it is / Why it matters / Key concepts / Examples / Beginner's path
- Used by `ExplainModal`

### `POST /api/prerequisites`
Body: `{ apiKey, term, domain, l1, l2? }`
- Returns streaming JSON object:
```json
{
  "difficulty": { "depth": 7, "estimatedMonths": 24, "level": "Graduate", "hoursTotal": 2400 },
  "chain": [
    { "name": "Set Theory", "why": "...", "months": 2 },
    ...
    { "name": "TARGET_TERM", "why": "Target field", "months": 0 }
  ]
}
```
- The last item in `chain` is always the target term itself
- Used by `LearningPathModal` (Prerequisites tab)

### `POST /api/studyplan`
Body: `{ apiKey, term, domain, l1, l2?, hoursPerWeek, prerequisites? }`
- Streams markdown study plan, week-by-week with phases
- Used by `LearningPathModal` (Study Plan tab)

---

## Feature List (as of 2026-06-09)

1. **Taxonomy browser** — Domain → L1 → L2 → L3 navigation
2. **On-demand generation** — Claude Sonnet generates L2/L3 on selection, cached in localStorage
3. **7 academic search links** per item — Google Scholar, Semantic Scholar ↑cited, OpenAlex ↑cited, CORE open access, Inciteful, Talpa Books, WorldCat ↑loaned
4. **Explain Me** — streaming beginner explanation modal for any L2/L3 item
5. **Wikipedia verification** — batch-check items, show ✓/✗/? badges with links; batches of 6 with 150ms pause
6. **Learning Path modal** (on every L2 and L3 card):
   - **Prerequisites tab**: ordered prerequisite chain with per-step time estimates + difficulty summary (level / depth / months / hours)
   - **Study Plan tab**: hours/week input → streaming week-by-week plan with real textbooks/courses
7. **Bookmarks** — star any topic card to save it; ★ button in header shows all bookmarks, stored in `omni_bookmarks` localStorage
8. **Difficulty badges** — colored level pill (Introductory/Undergraduate/Graduate/Research) on cards where prereq data is already cached
9. **Discover modal** — one "Discover" button per card opens a two-panel modal with 24 features across 5 groups:
   - **UNDERSTAND**: 1% Insight, Mental Models, Concept DNA, Origin Story, Misconceptions, Schools of Thought, Elevator Pitch
   - **WORKS**: The Canon, Reading Chain, Paper Trail, Seminal Timeline, Hidden Gems, Flashcards (with Copy All)
   - **EXPLORE**: Career Paths, Research Frontiers, Field History, Intellectual Genealogy, Resource Finder
   - **CONNECT**: Domain Analogies (input field), Topic Collision (input field), Compare Topics (input field)
   - **TEST YOURSELF**: Quiz Me (5 MCQ with scoring), Feynman Test (user writes → Claude grades), Socratic Dialogue (live chat)
10. **Reset Cache** — clears all generated and cached data from localStorage (including `omni_discover::` keys)

---

## Known Design Decisions & Gotchas

- **Scroll**: outer div must be `h-screen overflow-hidden`, `<main>` must be `overflow-y-auto`. Using `min-h-screen` breaks scrolling because there's no bounded parent.
- **L2 vs L3 granularity**: the prompts in `/api/generate` contain explicit correct/wrong examples. If you update the prompt, keep examples. Claude settles on round numbers (9 items) without the "do NOT stop at a round number" instruction.
- **Talpa Books URL**: uses `+` for spaces, not `%20`. Pattern: `https://www.talpasearch.com/search?query=term+with+spaces`
- **Wikipedia cache backward compatibility**: old cache entries were plain strings; new format is `JSON.stringify({status, url})`. The parse has a try/catch fallback.
- **Prerequisite JSON extraction**: Claude may emit thinking text before the JSON. Extract with `text.indexOf("{")` / `text.lastIndexOf("}")`, not by assuming the whole response is JSON.
- **Study plan cache key** includes `hoursPerWeek` so different hour inputs get separate cached plans.

---

## Current UI (as of 2026-06-09)

Screenshots of the live app — load these to see what the UI looks like before making changes:

**Main app (domain picker):**
![Omniscience app screenshot](https://iad.microlink.io/st2shHqyH_EKRA55U_-LioWb7icv-dof_ciToqiOwHIovjbbFRNR4iCfBVQGd9Aut--uE3ToQZ5-vKOyXxQfsg.png)

**Earlier screenshot (original launch):**
![Omniscience app screenshot v1](https://iad.microlink.io/NvfC9jhfw3Fd5E6AAUucBgiwdFJFH2MsQ2fYelgIAhIjgdrMDCcdST9sYKdPa-B5hSCRmm2sVFd4R8qQmmeEfg.png)

Live app: https://omniscience-production.up.railway.app

---

## How to Run Locally

```bash
npm install
npm run dev   # starts on http://localhost:3000
```

No `.env` needed — API key is entered by the user in the UI.

---

## How to Add a New Feature

1. If it needs Claude → add a new route in `app/api/<name>/route.ts` (copy the streaming pattern from an existing route)
2. If it's a new modal → create `components/<Name>Modal.tsx` (copy `ExplainModal` or `LearningPathModal` as template)
3. Add a button to the L2/L3 card section in `app/page.tsx` (look for the `flex gap-2` button row)
4. Add new localStorage key prefix to the Reset Cache filter in `app/page.tsx`
5. Deploy: `git push origin master` → Railway auto-deploys, OR `railway up --detach`

---

## Model Note

Currently using `claude-sonnet-4-6`. To upgrade model, update the `model` field in all five API routes:
- `app/api/generate/route.ts`
- `app/api/explain/route.ts`
- `app/api/prerequisites/route.ts`
- `app/api/studyplan/route.ts`
- `app/api/discover/route.ts`

Check https://docs.anthropic.com/en/docs/about-claude/models for the latest model IDs.
