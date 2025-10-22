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
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl mb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          D3 Sports Bracket Generator
        </h1>
        <p className="mt-2 text-gray-400">A 32-player knockout tournament bracket for tennis.</p>
      </header>
      
      <div className="w-full max-w-7xl mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search for a player to highlight their path..."
          />
      </div>

      <main className="w-full bg-gray-800 p-4 rounded-lg shadow-lg overflow-x-auto">
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