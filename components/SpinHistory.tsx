'use client';

interface SpinHistoryProps {
  history: { winner: string; timestamp: number }[];
}

export default function SpinHistory({ history }: SpinHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📜</span> Spin History
        </h2>
        <p className="text-gray-400 text-center py-4">No spins yet. Give it a try!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">📜</span> Spin History
        <span className="text-sm font-normal text-gray-400">({history.length})</span>
      </h2>
      <div className="max-h-48 overflow-y-auto space-y-2">
        {history.map((entry, index) => (
          <div
            key={`${entry.timestamp}-${index}`}
            className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 font-bold">#{history.length - index}</span>
              <span className="text-white font-medium truncate">{entry.winner}</span>
            </div>
            <span className="text-gray-400 text-sm">
              {formatTime(entry.timestamp)}
            </span>
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
