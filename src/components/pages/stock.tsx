/** biome-ignore-all lint/a11y/noLabelWithoutControl: TODO */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  Edit2,
  Filter,
  LoaderCircle,
  Package,
  Save,
  Search,
  X,
} from "lucide-react";
import React, { Activity, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { orpc } from "@/lib/orpc";
import type { Product } from "@/types";

const Stock = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const [isPending, startTransition] = useTransition();

  const productsQuery = useQuery(orpc.getProducts.queryOptions());
  const vendorsQuery = useQuery(orpc.getVendors.queryOptions());
  const transactionsQuery = useQuery(orpc.getTransactions.queryOptions());
  const supplyEntriesQuery = useQuery(orpc.getSupplyEntries.queryOptions());

  const updateProductMutation = useMutation(
    orpc.updateProduct.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
        toast.success("Product updated successfully");
        setEditingProduct(null);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to update product",
        );
      },
    }),
  );

  const products = productsQuery.data ?? [];
  const vendors = vendorsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const supplies = supplyEntriesQuery.data ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [vendorFilter, setVendorFilter] = React.useState("");
  const [sortKey, setSortKey] = React.useState<
    "name" | "stock" | "vendor" | "price"
  >("stock");

  // Default to today's local date
  const [dateFilter, setDateFilter] = React.useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  // Edit State
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(
    null,
  );
  const [editForm, setEditForm] = React.useState<{
    name: string;
    sellingPrice: number;
    costPrice: number;
  }>({ name: "", sellingPrice: 0, costPrice: 0 });

  const getVendorName = (id: string) =>
    vendors.find((v) => v.id === id)?.name || "Unknown Vendor";

  // biome-ignore lint/correctness/useExhaustiveDependencies: Cause Rerenders
  const processedProductsList = React.useMemo(() => {
    // 1. Calculate Historical Stock
    const [y, m, d] = dateFilter.split("-").map(Number);
    const targetDateEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

    const stockMap = new Map<string, number>();
    products?.forEach((p) => {
      stockMap.set(p.id, p.stock);
    });

    // Reverse Sales
    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate > targetDateEnd) {
        t.items.forEach((item) => {
          const current = stockMap.get(item.productId);
          if (current !== undefined) {
            stockMap.set(item.productId, current + item.quantity);
          }
        });
      }
    });

    // Reverse Supplies
    supplies.forEach((s) => {
      if (s.date > dateFilter) {
        const current = stockMap.get(s.productId);
        if (current !== undefined) {
          stockMap.set(s.productId, current - s.quantity);
        }
      }
    });

    // 2. Filter & Sort
    const data = products
      .map((p) => ({
        ...p,
        stock: Math.max(0, stockMap.get(p.id) || 0),
      }))
      .filter((p) => {
        const matchesSearch = p.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesVendor = vendorFilter ? p.vendorId === vendorFilter : true;
        return matchesSearch && matchesVendor;
      });

    data.sort((a, b) => {
      if (sortKey === "stock") return a.stock - b.stock;
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "vendor") {
        const vA = getVendorName(a.vendorId);
        const vB = getVendorName(b.vendorId);
        return vA.localeCompare(vB);
      }
      if (sortKey === "price") return a.sellingPrice - b.sellingPrice;
      return 0;
    });

    return data;
  }, [
    products,
    transactions,
    supplies,
    dateFilter,
    searchTerm,
    vendorFilter,
    sortKey,
  ]);

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice,
    });
  };

  const handleSaveEdit = () => {
    if (editingProduct) {
      startTransition(async () => {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          name: editForm.name,
          sellingPrice: editForm.sellingPrice,
          costPrice: editForm.costPrice,
        });
      });
    }
  };

  return (
    <div className="relative flex h-full animate-in flex-col gap-6 duration-300 fade-in">
      {/* Header & Controls */}
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

      {/* Table */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-gray-500">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th
                  className="cursor-pointer px-6 py-4 font-semibold tracking-wider transition-colors hover:bg-gray-100"
                  onClick={() => setSortKey("vendor")}
                >
                  Vendor Name {sortKey === "vendor" && "↓"}
                </th>
                <th
                  className="cursor-pointer px-6 py-4 font-semibold tracking-wider transition-colors hover:bg-gray-100"
                  onClick={() => setSortKey("name")}
                >
                  Item Name {sortKey === "name" && "↓"}
                </th>
                <th
                  className="cursor-pointer px-6 py-4 font-semibold tracking-wider transition-colors hover:bg-gray-100"
                  onClick={() => setSortKey("price")}
                >
                  Selling Price {sortKey === "price" && "↑"}
                </th>
                <th
                  className="cursor-pointer px-6 py-4 font-semibold tracking-wider transition-colors hover:bg-gray-100"
                  onClick={() => setSortKey("price")}
                >
                  Cost Price {sortKey === "price" && "↑"}
                </th>
                <th
                  className="cursor-pointer px-6 py-4 font-semibold tracking-wider transition-colors hover:bg-gray-100"
                  onClick={() => setSortKey("price")}
                >
                  Profit {sortKey === "price" && "↑"}
                </th>

                <th
                  className="cursor-pointer px-6 py-4 text-center font-semibold tracking-wider transition-colors hover:bg-gray-100"
                  onClick={() => setSortKey("stock")}
                >
                  Stock Level {sortKey === "stock" && "↑"}
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 text-center font-semibold tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productsQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <LoaderCircle
                        className="mb-4 animate-spin opacity-20"
                        size={48}
                      />
                      <p className="text-lg">Loading inventory...</p>
                    </div>
                  </td>
                </tr>
              ) : processedProductsList.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Package size={48} className="mb-4 opacity-20" />
                      <p className="text-lg">
                        No items found matching your criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                processedProductsList.map((product) => {
                  return (
                    <tr
                      key={product.id}
                      className="bg-white transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-medium text-gray-900">
                          {getVendorName(product.vendorId)}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500 opacity-70">
                          ID: {product.vendorId}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm text-gray-900">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-medium text-gray-900">
                          ₦{product.sellingPrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-medium text-gray-900">
                          ₦{product.costPrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-sm font-medium text-gray-900">
                          ₦
                          {(product.sellingPrice - product.costPrice).toFixed(
                            2,
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center align-middle">
                        <span
                          className={`text-sm font-bold px-2 py-1 rounded ${product.stock < 10 ? "bg-red-100 text-red-600" : "text-gray-900"}`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-center align-middle">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditClick({
                                ...product,
                                lastSupplyDate: String(
                                  product.lastSupplyDate ??
                                    new Date().toISOString(),
                                ),
                                lowStockThreshold: Number(
                                  product.lowStockThreshold ?? 0,
                                ),
                              })
                            }
                            className="rounded-lg p-2 text-pink-600 transition-colors hover:bg-pink-50"
                            title="Edit Product Details"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
          <span>Showing {processedProductsList.length} items</span>
          <span>
            Sorted by:{" "}
            {sortKey === "stock"
              ? "Stock Level (Asc)"
              : sortKey === "name"
                ? "Name"
                : sortKey === "price"
                  ? "Price"
                  : "Vendor"}
          </span>
        </div>
      </div>

      {/* Edit Modal (Admin Only) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md animate-in overflow-hidden rounded-xl bg-white shadow-2xl duration-200 zoom-in">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-6">
              <h3 className="flex items-center gap-2 font-bold text-gray-800">
                <Edit2 size={18} className="text-pink-600" /> Edit Product
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Cost Price (₦)
                  </label>
                  <input
                    type="number"
                    value={editForm.costPrice}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        costPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Selling Price (₦)
                  </label>
                  <input
                    type="number"
                    value={editForm.sellingPrice}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        sellingPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 p-2.5 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                <AlertTriangle size={16} className="shrink-0" />
                <p>
                  Stock quantity cannot be edited directly. To adjust stock,
                  please use the Vendor Supply interface.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveEdit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-pink-700"
                >
                  <Save size={18} /> Save Changes
                  <Activity mode={isPending ? "visible" : "hidden"}>
                    <LoaderCircle className="animate-spin" size={18} />
                  </Activity>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
