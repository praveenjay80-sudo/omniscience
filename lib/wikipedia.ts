export type VerifyStatus = "verified" | "uncertain" | "unverified" | "checking";

interface CacheEntry {
  status: VerifyStatus;
  url: string | null;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function isCloseMatch(term: string, title: string): boolean {
  const a = normalize(term);
  const b = normalize(title);
  return a === b || a.includes(b) || b.includes(a);
}

function wikiUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

export async function verifyTerm(
  term: string
): Promise<{ status: VerifyStatus; url: string | null }> {
  const cacheKey = `omni_wiki::${term}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const entry = JSON.parse(cached) as CacheEntry;
      return { status: entry.status, url: entry.url };
    } catch {
      // legacy cache was just a string status
      return { status: cached as VerifyStatus, url: null };
    }
  }

  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&list=search` +
      `&srsearch=${encodeURIComponent(term)}&srlimit=5&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();

    const hits: number = data?.query?.searchinfo?.totalhits ?? 0;
    if (hits === 0) {
      const entry: CacheEntry = { status: "unverified", url: null };
      localStorage.setItem(cacheKey, JSON.stringify(entry));
      return { status: "unverified", url: null };
    }

    const results: { title: string }[] = data?.query?.search ?? [];
    const match = results.find((r) => isCloseMatch(term, r.title));
    const status: VerifyStatus = match ? "verified" : "uncertain";
    const pageUrl = match
      ? wikiUrl(match.title)
      : results[0]
      ? wikiUrl(results[0].title)
      : null;

    const entry: CacheEntry = { status, url: pageUrl };
    localStorage.setItem(cacheKey, JSON.stringify(entry));
    return { status, url: pageUrl };
  } catch {
    return { status: "uncertain", url: null };
  }
}

export async function verifyAll(
  terms: string[],
  onUpdate: (index: number, status: VerifyStatus, url: string | null) => void
): Promise<void> {
  const BATCH = 6;
  for (let i = 0; i < terms.length; i += BATCH) {
    await Promise.all(
      terms.slice(i, i + BATCH).map(async (term, j) => {
        const { status, url } = await verifyTerm(term);
        onUpdate(i + j, status, url);
      })
    );
    if (i + BATCH < terms.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }
}
