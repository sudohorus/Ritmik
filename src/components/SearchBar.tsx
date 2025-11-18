import { useState, KeyboardEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Search tracks or artists..."
        className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-600"
      />
      <button
        onClick={handleSearch}
        disabled={loading || !query.trim()}
        className="px-6 py-3 bg-zinc-100 text-zinc-900 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 rounded-lg transition-all font-medium"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
}

