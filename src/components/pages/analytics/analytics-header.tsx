import { format, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import React from "react";

interface AnalyticsHeaderProps {
  dateRange: { start: string; end: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
}

export const AnalyticsHeader = ({ dateRange, setDateRange }: AnalyticsHeaderProps) => {
  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Business Analytics
        </h2>
        <p className="text-gray-500">
          Performance from{" "}
          <span className="font-medium text-gray-800">
            {format(parseISO(dateRange.start), "MMM d, yyyy")}
          </span>{" "}
          to{" "}
          <span className="font-medium text-gray-800">
            {format(parseISO(dateRange.end), "MMM d, yyyy")}
          </span>
        </p>
      </div>

      {/* Date Range Picker */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        <div className="relative flex items-center border-r border-gray-100 pr-2">
          <div className="pointer-events-none absolute left-2 text-gray-400">
            <span className="text-[10px] font-bold uppercase">From</span>
          </div>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="w-32 bg-transparent py-1.5 pr-2 pl-12 text-sm font-medium text-gray-700 focus:outline-none"
          />
        </div>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-2 text-gray-400">
            <span className="text-[10px] font-bold uppercase">To</span>
          </div>
          <input
            type="date"
            value={dateRange.end}
            min={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="w-32 bg-transparent py-1.5 pr-2 pl-8 text-sm font-medium text-gray-700 focus:outline-none"
          />
        </div>
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
          <Calendar size={16} />
        </button>
      </div>
    </div>
  );
};
