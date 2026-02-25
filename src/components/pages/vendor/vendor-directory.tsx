"use client";

import { Edit2, Trash2, Users } from "lucide-react";
import React from "react";
import type { Vendor } from "@/types";

interface VendorDirectoryProps {
  vendors: Vendor[];
  onRowClick: (id: string) => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
}

const VendorDirectory = ({
  vendors,
  onRowClick,
  onEdit,
  onDelete,
}: VendorDirectoryProps) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-700 uppercase shadow-sm">
            <tr>
              <th className="px-6 py-4">Vendor Name</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              return (
                <tr
                  key={v.id}
                  onClick={() => onRowClick(v.id)}
                  className="group cursor-pointer border-b bg-white transition-colors hover:bg-pink-50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-gray-800">{v.name}</p>
                      <div className="text-xs text-gray-400">ID: {v.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{v.contact}</td>
                  <td className="px-6 py-4">{v.email}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(v.id);
                        }}
                        className="rounded p-1.5 text-pink-600 transition-colors hover:bg-pink-100"
                        title="View Details"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(v.id);
                        }}
                        className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State Help Card */}
        {vendors.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <Users size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No vendors found</p>
            <p className="text-sm">Click "Add New Vendor" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDirectory;
