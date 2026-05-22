import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (subject: string) => void;
  subjects: string[];
}

export default function SearchBar({ onSearch, subjects }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredSubjects = subjects.filter(subject => 
    subject.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (subject: string) => {
    setQuery(subject);
    setShowSuggestions(false);
    onSearch(subject);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-4 border-2 border-slate-900 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-600 sm:text-lg"
          placeholder="Search by subject (e.g. Mathematics, Physics)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            if (e.target.value === '') {
              onSearch('');
            }
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        <button 
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-500 hover:bg-slate-900 text-white font-bold uppercase tracking-wider text-sm transition-colors border-2 border-slate-900"
        >
          Search
        </button>
      </form>

      {showSuggestions && query && filteredSubjects.length > 0 && (
        <ul className="absolute z-10 w-full bg-white mt-2 shadow-[4px_4px_0_0_#0f172a] border-2 border-slate-900 max-h-60 overflow-auto">
          {filteredSubjects.map((subject, index) => (
            <li 
              key={index}
              onClick={() => handleSelect(subject)}
              className="px-4 py-3 hover:bg-indigo-50 cursor-pointer text-slate-900 font-bold tracking-wide"
            >
              <div className="flex items-center gap-2">
                <Search size={14} className="text-slate-400" />
                {subject}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
