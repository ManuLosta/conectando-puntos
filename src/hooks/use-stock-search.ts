"use client";

import { useState, useEffect, useCallback } from "react";
import { DetailedStockItem } from "@/repositories/stock.repository";

interface UseStockSearchReturn {
  searchResults: DetailedStockItem[];
  isSearching: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

export function useStockSearch(): UseStockSearchReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DetailedStockItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce la búsqueda para evitar muchas llamadas a la API
  const debouncedSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/stock?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        console.error("Error searching stock:", response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching stock:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearch]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  return {
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    clearSearch,
  };
}
