"use client";

import { useState } from "react";
import { Taxonomy, Domain, L1Item, L2Item } from "@/lib/types";
import SearchLinks from "./SearchLinks";

interface TaxonomyBrowserProps {
  taxonomy: Taxonomy;
}

export default function TaxonomyBrowser({ taxonomy }: TaxonomyBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [expandedL1, setExpandedL1] = useState<Set<string>>(new Set());
  const [expandedL2, setExpandedL2] = useState<Set<string>>(new Set());

  const query = search.toLowerCase().trim();

  const toggleL1 = (key: string) => {
    setExpandedL1((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleL2 = (key: string) => {
    setExpandedL2((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const domainsToShow = selectedDomain
    ? taxonomy.domains.filter((d) => d.name === selectedDomain)
    : taxonomy.domains;

  const filteredDomains = domainsToShow
    .map((domain) => {
      if (!query) return domain;
      const filteredL1 = domain.l1
        .map((l1) => {
          const filteredL2 = l1.l2
            .map((l2) => {
              const filteredL3 = l2.l3.filter((l3) =>
                l3.name.toLowerCase().includes(query)
              );
              const l2Matches = l2.name.toLowerCase().includes(query);
              if (l2Matches || filteredL3.length > 0) {
                return { ...l2, l3: l2Matches ? l2.l3 : filteredL3 };
              }
              return null;
            })
            .filter(Boolean) as L2Item[];

          const l1Matches = l1.name.toLowerCase().includes(query);
          if (l1Matches || filteredL2.length > 0) {
            return { ...l1, l2: l1Matches ? l1.l2 : filteredL2 };
          }
          return null;
        })
        .filter(Boolean) as L1Item[];

      const domainMatches = domain.name.toLowerCase().includes(query);
      if (domainMatches || filteredL1.length > 0) {
        return { ...domain, l1: domainMatches ? domain.l1 : filteredL1 };
      }
      return null;
    })
    .filter(Boolean) as Domain[];

  const totalL3 = taxonomy.domains.reduce(
    (sum, d) =>
      sum +
      d.l1.reduce(
        (s, l1) =>
          s + l1.l2.reduce((s2, l2) => s2 + l2.l3.length, 0),
        0
      ),
    0
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Omniscience
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {taxonomy.domains.length} domains · {totalL3.toLocaleString()} topics
          </p>
        </div>
        <div className="p-3 border-b border-gray-800">
          <input
            type="text"
            placeholder="Search all topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 text-sm text-gray-100 placeholder-gray-500 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedDomain(null)}
            className={`w-full text-left text-sm px-3 py-2 rounded mb-1 transition-colors ${
              selectedDomain === null
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            All Domains
          </button>
          {taxonomy.domains.map((d) => (
            <button
              key={d.name}
              onClick={() =>
                setSelectedDomain(d.name === selectedDomain ? null : d.name)
              }
              className={`w-full text-left text-sm px-3 py-1.5 rounded mb-0.5 transition-colors ${
                selectedDomain === d.name
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              {d.name}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800 text-xs text-gray-500">
          Generated {new Date(taxonomy.generatedAt).toLocaleDateString()}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">
        {filteredDomains.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            No results for &quot;{search}&quot;
          </div>
        ) : (
          filteredDomains.map((domain) => (
            <section key={domain.name} className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-gray-800">
                {domain.name}
              </h2>
              <div className="space-y-3">
                {domain.l1.map((l1) => {
                  const l1Key = `${domain.name}::${l1.name}`;
                  const l1Open = expandedL1.has(l1Key) || !!query;
                  return (
                    <div
                      key={l1.name}
                      className="bg-gray-900 rounded-lg border border-gray-800"
                    >
                      <button
                        onClick={() => toggleL1(l1Key)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <span className="font-semibold text-blue-300">
                          {l1.name}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {l1Open ? "▲" : "▼"} {l1.l2.length} subfields
                        </span>
                      </button>
                      {l1Open && (
                        <div className="px-4 pb-3 space-y-2">
                          {l1.l2.map((l2) => {
                            const l2Key = `${l1Key}::${l2.name}`;
                            const l2Open = expandedL2.has(l2Key) || !!query;
                            return (
                              <div
                                key={l2.name}
                                className="border border-gray-700 rounded-md"
                              >
                                <button
                                  onClick={() => toggleL2(l2Key)}
                                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-800 rounded-md transition-colors"
                                >
                                  <span className="text-purple-300 text-sm font-medium">
                                    {l2.name}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    {l2Open ? "▲" : "▼"} {l2.l3.length} topics
                                  </span>
                                </button>
                                {l2Open && (
                                  <div className="px-3 pb-3 space-y-3">
                                    {l2.l3.map((l3) => (
                                      <div
                                        key={l3.name}
                                        className="bg-gray-800 rounded p-2"
                                      >
                                        <p className="text-sm text-gray-200 font-medium">
                                          {l3.name}
                                        </p>
                                        <SearchLinks term={l3.name} />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
