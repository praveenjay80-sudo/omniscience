export const SEARCH_LINKS = [
  // Papers — by relevance / citation
  {
    label: "Google Scholar",
    group: "papers",
    color: "bg-blue-700 hover:bg-blue-600",
    url: (term: string) =>
      `https://scholar.google.com/scholar?q=${encodeURIComponent(term)}`,
  },
  {
    label: "Sem. Scholar ↑cited",
    group: "papers",
    color: "bg-green-700 hover:bg-green-600",
    url: (term: string) =>
      `https://www.semanticscholar.org/search?q=${encodeURIComponent(term)}&sort=Cited-By-Count`,
  },
  {
    label: "OpenAlex ↑cited",
    group: "papers",
    color: "bg-teal-700 hover:bg-teal-600",
    url: (term: string) =>
      `https://openalex.org/works?search=${encodeURIComponent(term)}&sort=cited_by_count:desc`,
  },
  {
    label: "CORE (open access)",
    group: "papers",
    color: "bg-cyan-700 hover:bg-cyan-600",
    url: (term: string) =>
      `https://core.ac.uk/search?q=${encodeURIComponent(term)}`,
  },
  {
    label: "Inciteful",
    group: "papers",
    color: "bg-purple-700 hover:bg-purple-600",
    url: (term: string) =>
      `https://incitefulmed.com/academic/search?q=${encodeURIComponent(term)}`,
  },
  // Books
  {
    label: "Talpa Books",
    group: "books",
    color: "bg-amber-700 hover:bg-amber-600",
    url: (term: string) =>
      `https://www.talpasearch.com/search?query=${term.trim().replace(/\s+/g, "+")}`,
  },
  {
    label: "WorldCat ↑loaned",
    group: "books",
    color: "bg-orange-700 hover:bg-orange-600",
    url: (term: string) =>
      `https://www.worldcat.org/search?q=${encodeURIComponent(term)}`,
  },
];
