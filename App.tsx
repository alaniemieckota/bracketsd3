import React, { useState } from 'react';
import { Bracket } from './components/Bracket';
import { initialPlayers, generateBracketData } from './utils/bracketUtils';
import { BracketData } from './types';

const App: React.FC = () => {
  const [bracketData, setBracketData] = useState<BracketData>(() => generateBracketData(initialPlayers));
  const [highlightedPlayer, setHighlightedPlayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePlayerHighlight = (playerName: string | null) => {
    if (playerName) {
      setHighlightedPlayer(prev => (prev === playerName ? null : playerName));
    }
  };


  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pr-10 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search for a player to highlight their path..."
              aria-label="Search for a player"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
      </div>

      <main className="flex-grow w-full bg-gray-800 sm:max-w-7xl sm:mx-auto sm:mb-8 sm:rounded-lg sm:shadow-lg overflow-hidden">
          <Bracket 
            data={bracketData} 
            highlightedPlayer={highlightedPlayer}
            onHighlightPlayer={handlePlayerHighlight} 
            searchQuery={searchQuery}
          />
        </main>
    </div>
  );
};

export default App;