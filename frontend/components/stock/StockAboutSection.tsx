'use client'

import { useState } from 'react';
import { Separator } from "@/components/ui/separator";

interface StockAboutSectionProps {
  description: string | null;
  companyName: string | null;
  symbol: string;
}

const TRUNCATE_LENGTH = 250; // Adjust character limit as needed

export function StockAboutSection({ description, companyName, symbol }: StockAboutSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fallbackDescription = `${companyName || symbol}, Inc. engages in the design, manufacture, and sale of smartphones, personal computers, tablets, wearables, and accessories worldwide. It also sells various related services.`;
  const displayDescription = description || fallbackDescription;

  const isTruncated = displayDescription.length > TRUNCATE_LENGTH;
  const textToShow = isExpanded ? displayDescription : `${displayDescription.substring(0, TRUNCATE_LENGTH)}${isTruncated ? '...' : ''}`;

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4">About</h2>
      <Separator className="mb-4 bg-zinc-800" />

      <p className="text-zinc-300 mb-2 whitespace-pre-line">
        {textToShow}
      </p>
      {isTruncated && (
        <button
          onClick={toggleExpansion}
          className="text-orange-500 text-sm mb-8 hover:underline"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
} 