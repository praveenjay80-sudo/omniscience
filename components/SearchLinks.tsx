"use client";

import { SEARCH_LINKS } from "@/lib/searchUrls";

interface SearchLinksProps {
  term: string;
}

export default function SearchLinks({ term }: SearchLinksProps) {
  const papers = SEARCH_LINKS.filter((l) => l.group === "papers");
  const books = SEARCH_LINKS.filter((l) => l.group === "books");

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex flex-wrap gap-1">
        <span className="text-xs text-gray-600 w-full">Papers</span>
        {papers.map((link) => (
          <a
            key={link.label}
            href={link.url(term)}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs text-white px-2 py-0.5 rounded ${link.color} transition-colors`}
          >
            {link.label}
          </a>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="text-xs text-gray-600 w-full">Books</span>
        {books.map((link) => (
          <a
            key={link.label}
            href={link.url(term)}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs text-white px-2 py-0.5 rounded ${link.color} transition-colors`}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
