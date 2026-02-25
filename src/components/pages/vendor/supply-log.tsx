"use client";

import { Calendar, Edit2, Search, Trash2, X } from "lucide-react";
import React from "react";

interface SupplyLogProps {
  tableData: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
  onSort: (key: string) => void;
  onEdit: (row: any) => void;
  onDelete: (id: string) => void;
}

const SupplyLog = ({
  tableData,
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  onSort,
  onEdit,
  onDelete,
}: SupplyLogProps) => {
  return (
    <div className="flex h-full flex-col">
      {/* Filters */}
      <div className="flex flex-col gap-4 border-b border-gray-100 p-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Item, Vendor or PO#..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-500" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 outline-none focus:ring-2 focus:ring-pink-500"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter("")}
              className="text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Supply History Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-700 uppercase shadow-sm">
            <tr>
              {[
                { label: "Date", key: "date" },
                { label: "Vendor", key: "vendorName" },
                { label: "Item", key: "productName" },
                { label: "Qty", key: "quantity", align: "text-center" },
                { label: "Cost Price", key: "costPrice", align: "text-right" },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 cursor-pointer hover:bg-gray-100 ${col.align || ""}`}
                  onClick={() => onSort(col.key)}
                >
                  <div className={`flex items-center gap-1 ${col.align === "text-right" ? "justify-end" : col.align === "text-center" ? "justify-center" : ""}`}>
                    {col.label}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                  No supply records found.
                </td>
              </tr>
            ) : (
              tableData.map((row) => (
                <tr key={row.id} className="border-b bg-white transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium whitespace-nowrap text-gray-900">
                    {row.date}
                    {row.purchaseOrderNumber && (
                      <div className="text-xs text-gray-400">PO: {row.purchaseOrderNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">{row.vendorName}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{row.productName}</td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">{row.quantity}</td>
                  <td className="px-6 py-4 text-right font-mono">₦{row.costPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="rounded p-1.5 text-pink-600 transition-colors hover:bg-pink-50"
                        title="Edit Record"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row.id)}
                        className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplyLog;
