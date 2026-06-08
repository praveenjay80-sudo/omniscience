"use client";

import { VerifyStatus } from "@/lib/wikipedia";

interface VerifyBadgeProps {
  status: VerifyStatus | undefined;
  url?: string | null;
}

export default function VerifyBadge({ status, url }: VerifyBadgeProps) {
  if (!status) return null;

  if (status === "checking") {
    return (
      <span className="inline-flex items-center text-xs text-gray-500 ml-2">
        <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin inline-block" />
      </span>
    );
  }

  const config = {
    verified: {
      label: "✓ Wikipedia",
      cls: "bg-green-900/60 text-green-300 border-green-700 hover:bg-green-800/60",
      title: "Found on Wikipedia",
    },
    uncertain: {
      label: "? Wikipedia",
      cls: "bg-yellow-900/60 text-yellow-300 border-yellow-700 hover:bg-yellow-800/60",
      title: "Partial Wikipedia match — may be niche or hallucinated",
    },
    unverified: {
      label: "✗ Wikipedia",
      cls: "bg-red-900/60 text-red-400 border-red-800 hover:bg-red-800/60",
      title: "No Wikipedia results — treat with caution",
    },
  }[status];

  const className = `inline-block text-xs px-1.5 py-0.5 rounded border ml-2 ${config.cls} transition-colors`;

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={config.title}
        className={className + " cursor-pointer"}
        onClick={(e) => e.stopPropagation()}
      >
        {config.label} ↗
      </a>
    );
  }

  return (
    <span title={config.title} className={className + " cursor-help"}>
      {config.label}
    </span>
  );
}
