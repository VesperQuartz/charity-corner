"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { orpc } from "@/lib/orpc";
import type { Product } from "@/types";
import { EditProductModal } from "./stock/edit-product-modal";
import { StockHeader } from "./stock/stock-header";
import { StockTable } from "./stock/stock-table";

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
    vendors, // Added vendors as dependency because getVendorName uses it
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
      <StockHeader
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        vendorFilter={vendorFilter}
        setVendorFilter={setVendorFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        vendors={vendors}
      />

      <StockTable
        isLoading={productsQuery.isLoading}
        products={processedProductsList as any}
        sortKey={sortKey}
        setSortKey={setSortKey}
        getVendorName={getVendorName}
        isAdmin={isAdmin}
        handleEditClick={handleEditClick}
      />

      <EditProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveEdit}
        isPending={isPending}
      />
    </div>
  );
};

export default Stock;
