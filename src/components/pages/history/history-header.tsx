import { Calendar } from "lucide-react";
import React from "react";

interface HistoryHeaderProps {
  dateRange: { start: string; end: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
}

export const HistoryHeader = ({ dateRange, setDateRange }: HistoryHeaderProps) => {
  return (
    <div className="flex flex-col items-start justify-between rounded-lg bg-white p-4 shadow-sm md:flex-row md:items-center">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
        Sales History
      </h2>

      <div className="mt-4 flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center md:mt-0 md:w-auto">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-2 text-gray-400">
              <span className="text-xs font-medium">From</span>
            </div>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-32 bg-transparent py-1.5 pr-2 pl-10 text-sm text-gray-700 focus:outline-none"
            />
          </div>
          <div className="text-gray-400">-</div>
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-2 text-gray-400">
              <span className="text-xs font-medium">To</span>
            </div>
            <input
              type="date"
              value={dateRange.end}
              min={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-32 bg-transparent py-1.5 pr-2 pl-8 text-sm text-gray-700 focus:outline-none"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const today = now.toISOString().split("T")[0];
                setDateRange({ start: today, end: today });
              }}
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-500"
              title="Reset to Today"
            >
              <Calendar size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
