"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useSearch } from '@/context/SearchContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { debounce } from 'lodash';
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { useRouter } from 'next/navigation';

interface SearchResult {
  symbol: string;
  name: string;
  currency: string;
  exchangeFullName: string;
  exchange: string;
  exchangeShortName?: string;
}

export function SearchModal() {
  const { isSearchOpen, closeSearch } = useSearch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchResults = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch from our internal API route instead of directly from FMP
        const response = await fetch(`/api/stock/search?q=${encodeURIComponent(searchQuery)}`);

        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
              // Try to parse specific error from our API route
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg; // Use API error if available
            } catch (parseError) {
              // Ignore if response isn't JSON
            }
            throw new Error(errorMsg);
        }

        const data: SearchResult[] = await response.json();
        setResults(data);
      } catch (err: any) {
        console.error("Search Modal Fetch Error:", err);
        setError(err.message || 'Failed to fetch search results.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300), // 300ms debounce delay
    []
  );

  useEffect(() => {
    if (isSearchOpen) {
      debouncedFetchResults(query);
    }
    // Cleanup debounce on unmount or when modal closes
    return () => {
      debouncedFetchResults.cancel();
    };
  }, [query, isSearchOpen, debouncedFetchResults]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('');
      setResults([]);
      setLoading(false);
      setError(null);
    }
  }, [isSearchOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeSearch();
    }
  };

  const handleSelect = (symbol: string) => {
    // Navigate to the stock page and close the modal
    router.push(`/stocks/${symbol}`);
    closeSearch();
  };

  return (
    <Dialog open={isSearchOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">Search Stocks</DialogTitle>
          <DialogDescription>
            Find stocks by name or symbol.
          </DialogDescription>
        </DialogHeader>
        <div className="relative px-6 pb-4">
          <SearchIcon className="absolute left-9 top-[40%] -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search (e.g., AAPL, Apple)..."
            className="w-full pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search stocks"
          />
        </div>
        <div className="px-6 pb-6 max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}
          {error && (
            <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
              Error: {error}
            </div>
          )}
          {!loading && !error && results.length > 0 && (
            <Command>
              <CommandEmpty>
                No results found.
              </CommandEmpty>
              <CommandGroup heading="Results">
                {results.map((item) => (
                  <CommandItem
                    key={item.symbol}
                    value={`${item.symbol} - ${item.name}`}
                    onSelect={() => handleSelect(item.symbol)}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <span className="font-medium">{item.symbol}</span>
                      <span className="text-sm text-gray-500 ml-2 truncate">
                        {item.name}
                      </span>
                    </div>
                    {item.exchangeShortName && (
                      <Badge variant="outline" className="text-xs">
                        {item.exchangeShortName}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          )}
          {!loading && !error && query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No results found for &quot;{query}&quot;.
            </div>
          )}
           {!loading && !error && query.length < 2 && results.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Enter at least 2 characters to search.
            </div>
          )}
        </div>
        <div className="text-center text-sm text-gray-500 py-2 px-4 border-t">
          Press &quot;Ctrl + K&quot; (or &quot;⌘ + K&quot; on Mac) to search.
        </div>
      </DialogContent>
    </Dialog>
  );
} 