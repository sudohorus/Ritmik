import { useState, KeyboardEvent, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

interface SearchSuggestion {
  query: string;
  type: 'recent' | 'popular';
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      const parsed = JSON.parse(recent);
      setSuggestions(parsed.map((q: string) => ({ query: q, type: 'recent' as const })));
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (searchQuery: string) => {
    const recent = localStorage.getItem('recentSearches');
    let searches: string[] = recent ? JSON.parse(recent) : [];

    searches = searches.filter(s => s !== searchQuery);
    searches.unshift(searchQuery);

    searches = searches.slice(0, 5);

    localStorage.setItem('recentSearches', JSON.stringify(searches));
    setSuggestions(searches.map(q => ({ query: q, type: 'recent' })));
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      onSearch(finalQuery);
      saveRecentSearch(finalQuery);
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    handleSearch(suggestion.query);
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recentSearches');
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search tracks or artists..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-600"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                <span className="text-xs text-zinc-500 font-medium">Recent Searches</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear
                </button>
              </div>

              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors flex items-center gap-3 group"
                >
                  <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-zinc-300 group-hover:text-white">
                    {suggestion.query}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-zinc-100 text-zinc-900 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 rounded-lg transition-all font-medium"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </div>
  );
}
