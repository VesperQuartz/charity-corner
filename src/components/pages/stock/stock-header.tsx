import { Calendar, Filter, Search } from "lucide-react";
import React from "react";
import { Vendor } from "@/types";

interface StockHeaderProps {
  dateFilter: string;
  setDateFilter: (date: string) => void;
  vendorFilter: string;
  setVendorFilter: (vendor: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  vendors: Vendor[];
}

export const StockHeader = ({
  dateFilter,
  setDateFilter,
  vendorFilter,
  setVendorFilter,
  searchTerm,
  setSearchTerm,
  vendors,
}: StockHeaderProps) => {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:flex-row md:items-center">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-800">
          Stock Inventory
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Monitor inventory levels by vendor and item.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
        {/* Date Filter */}
        <div className="relative">
          <Calendar
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="date"
            className="w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm text-gray-700 transition-colors outline-none hover:bg-gray-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-500 sm:w-auto"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {/* Vendor Filter */}
        <div className="relative">
          <Filter
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <select
            className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm text-gray-700 transition-colors outline-none hover:bg-gray-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-500 sm:w-48"
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search Items..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pr-4 pl-10 transition-all outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500 sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
