'use client';

import { useState } from 'react';

interface SpinHistoryProps {
  history: { winner: string; timestamp: number }[];
}

export default function SpinHistory({ history }: SpinHistoryProps) {
  const [tab, setTab] = useState<'all' | 'day'>('all');

  if (history.length === 0) {
    return (
      <div className="h-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📜</span> Spin History
        </h2>
        <p className="text-gray-400 text-center py-4">No spins yet. Give it a try!</p>
      </div>
    );
  }

  // history is newest-first, so groups come out newest-first too
  const days = new Map<string, typeof history>();
  for (const entry of history) {
    const key = formatDay(entry.timestamp);
    days.set(key, [...(days.get(key) ?? []), entry]);
  }

  return (
    <div className="h-full flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
        <span className="text-2xl">📜</span> Spin History
        <span className="text-sm font-normal text-gray-400">({history.length})</span>
      </h2>

      <div className="flex gap-2 mb-3" role="tablist">
        {([['all', 'All'], ['day', 'Per Day']] as const).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {tab === 'all'
          ? history.map((entry, index) => (
              <div
                key={`${entry.timestamp}-${index}`}
                className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-bold">#{history.length - index}</span>
                  <span className="text-white font-medium truncate">{entry.winner}</span>
                </div>
                <span className="text-gray-400 text-sm">{formatTime(entry.timestamp)}</span>
              </div>
            ))
          : [...days].map(([day, entries]) => (
              <div key={day}>
                <div className="sticky top-0 flex items-center justify-between bg-gray-800 rounded-lg px-4 py-1.5 mb-2 text-sm font-semibold text-blue-300">
                  <span>{day}</span>
                  <span className="text-gray-400 font-normal">{entries.length} spins</span>
                </div>
                <div className="space-y-2 mb-3">
                  {entries.map((entry, index) => (
                    <div
                      key={`${entry.timestamp}-${index}`}
                      className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-2"
                    >
                      <span className="text-white font-medium truncate">{entry.winner}</span>
                      <span className="text-gray-400 text-sm">{formatTime(entry.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDay(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
