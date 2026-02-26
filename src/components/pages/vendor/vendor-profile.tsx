"use client";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Layers,
  Mail,
  Package,
  Phone,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

interface VendorProfileProps {
  vendor: any;
  supplies: any[];
  vendorSales: any[];
  vendorCOGS: number;
  onBack: () => void;
  onEdit: (vendor: any) => void;
  onDelete: (id: string) => void;
  onOpenBulkSupply: () => void;
  onOpenNewSupply: () => void;
  onDeleteSupply: (id: string) => void;
}

const VendorProfile = ({
  vendor,
  supplies,
  vendorSales,
  vendorCOGS,
  onBack,
  onEdit,
  onDelete,
  onOpenBulkSupply,
  onOpenNewSupply,
  onDeleteSupply,
}: VendorProfileProps) => {
  const [activeTab, setActiveTab] = useState<"supplies" | "sales">("supplies");
  const [salesDateFilter, setSalesDateFilter] = useState("");

  const filteredSales = useMemo(() => {
    if (!salesDateFilter) return vendorSales;
    console.log("V", vendorSales);
    return vendorSales.filter((s) => s.date.startsWith(salesDateFilter));
  }, [vendorSales, salesDateFilter]);

  const totalVendorSales = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + curr.total, 0);
  }, [filteredSales]);

  return (
    <div className="flex h-full animate-in flex-col gap-6 duration-200 fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Vendor Profile</h2>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-3">
        {/* SECTION 1: Vendor Information */}
        <div className="h-fit rounded-lg bg-white p-6 shadow-sm md:col-span-1">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-2xl font-bold text-pink-600">
              {vendor.name.charAt(0)}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(vendor)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-600"
                title="Edit Vendor"
              >
                <Edit2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(vendor.id)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                title="Delete Vendor"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <h3 className="mb-1 text-xl font-bold text-gray-900">
            {vendor.name}
          </h3>
          <p className="mb-6 font-mono text-sm text-gray-400">
            ID: {vendor.id}
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50">
                <Phone size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="font-medium">{vendor.contact || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-medium">{vendor.email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Last Supplied</p>
                <p className="font-medium">
                  {supplies.length > 0 ? supplies[0].date : "No History"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Tabbed History & Sales */}
        <div className="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm md:col-span-2">
          {/* Tabs */}
          <div className="flex gap-8 border-b border-gray-100 bg-gray-50 px-6 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("supplies")}
              className={`py-4 text-sm font-medium transition-all border-b-2 px-1 flex items-center gap-2 ${
                activeTab === "supplies"
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Package size={16} /> Supply History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sales")}
              className={`py-4 text-sm font-medium transition-all border-b-2 px-1 flex items-center gap-2 ${
                activeTab === "sales"
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <ShoppingCart size={16} /> Vendor Sales
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            {activeTab === "supplies" ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 bg-white p-4">
                  <span className="text-xs font-normal text-gray-500">
                    Total COGS:{" "}
                    <span className="font-bold text-gray-900">
                      ₦
                      {vendorCOGS?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onOpenBulkSupply}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-pink-600 transition-colors hover:bg-pink-50"
                    >
                      <Layers size={14} /> Bulk Supply
                    </button>
                    <button
                      type="button"
                      onClick={onOpenNewSupply}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-pink-600 transition-colors hover:bg-pink-50"
                    >
                      <Plus size={14} /> Add New
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-700 uppercase">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Item Name</th>
                        <th className="px-6 py-3 text-center">Qty</th>
                        <th className="px-6 py-3 text-right">Cost Price</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplies.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-gray-400"
                          >
                            No supply history recorded for this vendor.
                          </td>
                        </tr>
                      ) : (
                        supplies.map((supply) => (
                          <tr
                            key={supply.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="px-6 py-3 whitespace-nowrap">
                              {supply.date}
                            </td>
                            <td className="px-6 py-3 font-medium text-gray-800">
                              {supply.productName}
                              {supply.purchaseOrderNumber && (
                                <span className="block text-xs text-gray-400">
                                  {supply.purchaseOrderNumber}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3 text-center font-medium text-gray-900">
                              {supply.quantity}
                            </td>
                            <td className="px-6 py-3 text-right font-mono">
                              ₦{supply.costPrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => onDeleteSupply(supply.id)}
                                className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                title="Delete Record"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Sales Filter */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-500" />
                    <input
                      type="date"
                      value={salesDateFilter}
                      onChange={(e) => setSalesDateFilter(e.target.value)}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    {salesDateFilter && (
                      <button
                        type="button"
                        onClick={() => setSalesDateFilter("")}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-normal text-gray-500">
                    Showing {filteredSales.length} sale records
                  </span>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-700 uppercase">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Item</th>
                        <th className="px-6 py-3 text-center">Qty Sold</th>
                        <th className="px-6 py-3 text-right">Total (₦)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-8 text-center text-gray-400"
                          >
                            No sales records found for this vendor.
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map((sale, idx) => {
                          console.log(sale);
                          return (
                            <tr
                              key={`${sale.date}-${sale.name}-${idx}`}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-6 py-3 whitespace-nowrap">
                                {new Date(sale.date).toLocaleDateString()}
                                <span className="block text-xs text-gray-400">
                                  {new Date(sale.date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </td>
                              <td className="px-6 py-3 font-medium text-gray-800">
                                {sale.name}
                              </td>
                              <td className="px-6 py-3 text-center font-medium text-gray-900">
                                {sale.quantity}
                              </td>
                              <td className="px-6 py-3 text-right font-mono font-bold text-green-600">
                                ₦{sale.total.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {filteredSales.length > 0 && (
                      <tfoot className="sticky bottom-0 bg-gray-50 font-bold text-gray-900 shadow-[0_-1px_0_rgba(0,0,0,0.05)]">
                        <tr>
                          <td
                            colSpan={3}
                            className="px-6 py-4 text-right text-xs tracking-wider uppercase"
                          >
                            Accumulated Total Vendor Sales:
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-lg text-pink-600">
                            ₦{totalVendorSales.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
