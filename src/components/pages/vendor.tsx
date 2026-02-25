/** biome-ignore-all lint/a11y/noLabelWithoutControl: TODO */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";
import React, { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc";
import type { Vendor } from "@/types";
import BulkSupplyModal from "./vendor/bulk-supply-modal";
import BulkVendorModal from "./vendor/bulk-vendor-modal";
// Import sub-components
import DeleteModal from "./vendor/delete-modal";
import SupplyLog from "./vendor/supply-log";
import SupplyModal from "./vendor/supply-modal";
import VendorDirectory from "./vendor/vendor-directory";
import VendorModal from "./vendor/vendor-modal";
import VendorProfile from "./vendor/vendor-profile";

const VendorPage = () => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const vendorsQuery = useQuery(orpc.getVendors.queryOptions());
  const productsQuery = useQuery(orpc.getProducts.queryOptions());
  const supplyEntriesQuery = useQuery(orpc.getSupplyEntries.queryOptions());
  const t = useQuery(orpc.getTransactions.queryOptions());

  const createVendorMutation = useMutation(
    orpc.createVendor.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getVendors.queryKey() });
      },
    }),
  );
  const updateVendorMutation = useMutation(
    orpc.updateVendor.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getVendors.queryKey() });
      },
    }),
  );
  const deleteVendorMutation = useMutation(
    orpc.deleteVendor.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getVendors.queryKey() });
      },
    }),
  );
  const createProductMutation = useMutation(
    orpc.createProduct.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );
  const updateProductMutation = useMutation(
    orpc.updateProduct.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );
  const createSupplyEntryMutation = useMutation(
    orpc.createSupplyEntry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getSupplyEntries.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );
  const updateSupplyEntryMutation = useMutation(
    orpc.updateSupplyEntry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getSupplyEntries.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );
  const deleteSupplyEntryMutation = useMutation(
    orpc.deleteSupplyEntry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getSupplyEntries.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );

  const vendors = vendorsQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const supplies = supplyEntriesQuery.data ?? [];

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<"supplies" | "vendors">(
    "supplies",
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isBulkSupplyModalOpen, setIsBulkSupplyModalOpen] = useState(false);
  const [isBulkVendorModalOpen, setIsBulkVendorModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  // Edit states
  const [editingSupplyId, setEditingSupplyId] = useState<string | null>(null);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  // Delete confirmation state
  const [supplyToDelete, setSupplyToDelete] = useState<string | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

  // --- Table Filter & Sort State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });

  // --- Helpers ---
  const getLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const generatePO = () => {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PO-${date}-${random}`;
  };

  // --- Handlers ---

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const openNewSupply = () => {
    setEditingSupplyId(null);
    setIsSupplyModalOpen(true);
  };

  const openEditSupply = (entry: any) => {
    setEditingSupplyId(entry.id);
    setIsSupplyModalOpen(true);
  };

  const handleSupplySubmit = async (value: any) => {
    startTransition(async () => {
      let finalVendorId = value.vendorId;
      if (!finalVendorId) {
        const nameEntered = value.vendorName.trim();
        const match = vendors.find(
          (v) => v.name.toLowerCase() === nameEntered.toLowerCase(),
        );
        if (match) {
          finalVendorId = match.id;
        } else {
          try {
            const created = await createVendorMutation.mutateAsync({
              name: nameEntered,
              contact: "-",
              email: "noreply@vendor.local",
            });
            finalVendorId = created.id;
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Failed to create vendor",
            );
            return;
          }
        }
      }

      let finalProductId = value.productId;
      if (!finalProductId) {
        try {
          const created = await createProductMutation.mutateAsync({
            name: value.itemName.trim(),
            costPrice: value.costPrice,
            sellingPrice: value.sellingPrice,
            stock: 0,
            vendorId: finalVendorId,
            lowStockThreshold: value.lowStockThreshold,
          });
          finalProductId = created.id;
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to create product",
          );
          return;
        }
      } else {
        const existingProduct = products.find((p) => p.id === finalProductId);
        if (
          existingProduct &&
          existingProduct.lowStockThreshold !== value.lowStockThreshold
        ) {
          try {
            await updateProductMutation.mutateAsync({
              id: finalProductId,
              lowStockThreshold: value.lowStockThreshold,
            });
          } catch {
            // non-blocking
          }
        }
      }

      const payload = {
        date: value.date,
        vendorId: finalVendorId,
        productId: finalProductId,
        quantity: value.quantity,
        costPrice: value.costPrice,
        sellingPrice: value.sellingPrice,
        purchaseOrderNumber: value.purchaseOrder,
        isPaid: false,
      };

      try {
        if (editingSupplyId) {
          await updateSupplyEntryMutation.mutateAsync({
            id: editingSupplyId,
            ...payload,
          });
          toast.success("Supply record updated successfully");
        } else {
          await createSupplyEntryMutation.mutateAsync(payload);
          toast.success("New supply record added successfully");
        }
        setIsSupplyModalOpen(false);
        setEditingSupplyId(null);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save supply entry",
        );
      }
    });
  };

  const handleBulkSupplyUpload = async (entries: any[]) => {
    const validRows = entries.filter((r) => r.isValid);
    const currentVendors = [...vendors];
    const currentProducts = [...products];

    for (const row of validRows) {
      let finalVendorId: string;
      const vendorMatch = currentVendors.find(
        (v) => v.name.toLowerCase() === row.vendorName.trim().toLowerCase(),
      );
      if (vendorMatch) {
        finalVendorId = vendorMatch.id;
      } else {
        const created = await createVendorMutation.mutateAsync({
          name: row.vendorName.trim(),
          contact: "-",
          email: "noreply@vendor.local",
        });
        finalVendorId = created.id;
        currentVendors.push(created);
      }

      let finalProductId: string;
      const productMatch = currentProducts.find(
        (p) => p.name.toLowerCase() === row.itemName.trim().toLowerCase(),
      );
      if (productMatch) {
        finalProductId = productMatch.id;
      } else {
        const created = await createProductMutation.mutateAsync({
          name: row.itemName.trim(),
          costPrice: row.costPrice,
          sellingPrice: row.sellingPrice,
          stock: 0,
          vendorId: finalVendorId,
        });
        finalProductId = created.id;
        currentProducts.push(created);
      }

      await createSupplyEntryMutation.mutateAsync({
        date: row.date,
        vendorId: finalVendorId,
        productId: finalProductId,
        quantity: row.quantity,
        costPrice: row.costPrice,
        sellingPrice: row.sellingPrice,
        purchaseOrderNumber: row.poNumber,
        isPaid: false,
      });
    }
    toast.success(`Successfully processed ${validRows.length} records.`);
  };

  const handleVendorSubmit = async (value: any) => {
    startTransition(async () => {
      if (editingVendorId) {
        try {
          await updateVendorMutation.mutateAsync({
            id: editingVendorId,
            ...value,
          });
          toast.success("Vendor updated successfully");
          setIsVendorModalOpen(false);
          setEditingVendorId(null);
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Failed to update vendor",
          );
        }
      } else {
        try {
          await createVendorMutation.mutateAsync(value);
          toast.success("New vendor added successfully");
          setIsVendorModalOpen(false);
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Failed to create vendor",
          );
        }
      }
    });
  };

  const handleBulkVendorUpload = async (entries: any[]) => {
    const validRows = entries.filter((r) => r.isValid);
    let addedCount = 0;

    for (const row of validRows) {
      const exists = vendors.find(
        (v) => v.name.toLowerCase() === row.name.trim().toLowerCase(),
      );
      if (!exists) {
        await createVendorMutation.mutateAsync({
          name: row.name.trim(),
          contact: row.contact?.trim() || "-",
          email: row.email?.trim() || "noreply@vendor.local",
        });
        addedCount++;
      }
    }
    toast.success(`Process complete. Added ${addedCount} new vendors.`);
  };

  const confirmDeleteSupply = () => {
    if (supplyToDelete) {
      deleteSupplyEntryMutation.mutate(
        { id: supplyToDelete },
        {
          onSuccess: () => {
            toast.success("Supply record deleted successfully");
            setSupplyToDelete(null);
          },
          onError: (e) =>
            toast.error(e instanceof Error ? e.message : "Failed to delete"),
        },
      );
    }
  };

  const confirmDeleteVendor = () => {
    if (vendorToDelete) {
      deleteVendorMutation.mutate(
        { id: vendorToDelete },
        {
          onSuccess: () => {
            toast.success("Vendor deleted successfully");
            if (selectedVendorId === vendorToDelete) setSelectedVendorId(null);
            setVendorToDelete(null);
          },
          onError: (e) =>
            toast.error(e instanceof Error ? e.message : "Failed to delete"),
        },
      );
    }
  };

  // --- Computed Data ---
  const tableData = useMemo(() => {
    let data = supplies.map((s) => {
      const product = products.find((p) => p.id === s.productId);
      const vendor = vendors.find((v) => v.id === s.vendorId);
      const marginAmount = s.sellingPrice - s.costPrice;

      return {
        ...s,
        productName: product ? product.name : "Unknown Item",
        vendorName: vendor ? vendor.name : "Unknown Vendor",
        marginAmount,
      };
    });

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          item.productName.toLowerCase().includes(lower) ||
          item.vendorName.toLowerCase().includes(lower) ||
          item.purchaseOrderNumber.toLowerCase().includes(lower),
      );
    }
    if (dateFilter) {
      data = data.filter((item) => item.date === dateFilter);
    }

    data.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof typeof a];
      const bVal = b[sortConfig.key as keyof typeof b];
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [supplies, products, vendors, searchTerm, dateFilter, sortConfig]);

  const supplyToDeleteDetails = useMemo(() => {
    if (!supplyToDelete) return null;
    const supply = supplies.find((s) => s.id === supplyToDelete);
    if (!supply) return null;
    const product = products.find((p) => p.id === supply.productId);
    return { ...supply, productName: product?.name || "Unknown Item" };
  }, [supplyToDelete, supplies, products]);

  const vendorToDeleteDetails = useMemo(() => {
    if (!vendorToDelete) return null;
    return vendors.find((v) => v.id === vendorToDelete);
  }, [vendorToDelete, vendors]);

  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId),
    [vendors, selectedVendorId],
  );

  const selectedVendorSupplies = useMemo(() => {
    if (!selectedVendorId) return [];
    return supplies
      .filter((s) => s.vendorId === selectedVendorId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((s) => {
        const product = products.find((p) => p.id === s.productId);
        return {
          ...s,
          productName: product ? product.name : "Unknown Item",
        };
      });
  }, [supplies, products, selectedVendorId]);

  const vendorCOGS = useMemo(() => {
    if (!selectedVendorId) return 0;
    const vendorProductIds = new Set(
      products.filter((p) => p.vendorId === selectedVendorId).map((p) => p.id),
    );
    return t.data?.reduce((total, txn) => {
      const txnCost = txn.items.reduce((itemTotal, item) => {
        if (vendorProductIds.has(item.productId)) {
          const product = products.find((p) => p.id === item.productId);
          if (product) return itemTotal + item.quantity * product.costPrice;
        }
        return itemTotal;
      }, 0);
      return total + txnCost;
    }, 0);
  }, [products, selectedVendorId, t.data]);

  const vendorSales = useMemo(() => {
    if (!selectedVendorId || !t.data) return [];
    const vendorProductIds = new Set(
      products.filter((p) => p.vendorId === selectedVendorId).map((p) => p.id),
    );

    const sales: {
      date: string;
      name: string;
      quantity: number;
      total: number;
    }[] = [];

    t.data.forEach((txn) => {
      txn.items.forEach((item) => {
        if (vendorProductIds.has(item.productId)) {
          sales.push({
            date: txn.date,
            name: item.name,
            quantity: item.quantity,
            total: item.quantity * item.priceAtSale,
          });
        }
      });
    });

    return sales.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [products, selectedVendorId, t.data]);

  const supplyInitialValues = useMemo(() => {
    if (editingSupplyId) {
      const entry = supplies.find((s) => s.id === editingSupplyId);
      if (entry) {
        const product = products.find((p) => p.id === entry.productId);
        const vendor = vendors.find((v) => v.id === entry.vendorId);
        return {
          date: entry.date,
          vendorId: entry.vendorId,
          vendorName: vendor?.name || "",
          itemName: product?.name || "",
          productId: entry.productId,
          quantity: entry.quantity,
          costPrice: entry.costPrice,
          sellingPrice: entry.sellingPrice,
          profit: entry.sellingPrice - entry.costPrice,
          purchaseOrder: entry.purchaseOrderNumber || "",
          lowStockThreshold: product?.lowStockThreshold ?? 10,
        };
      }
    }
    return {
      date: getLocalDateStr(),
      vendorName: "",
      vendorId: "",
      itemName: "",
      productId: "",
      quantity: 0,
      costPrice: 0,
      sellingPrice: 0,
      profit: 0,
      purchaseOrder: generatePO(),
      lowStockThreshold: 10,
    };
  }, [editingSupplyId, supplies, products, vendors]);

  return (
    <div className="relative h-full">
      {selectedVendorId && selectedVendor ? (
        <VendorProfile
          vendor={selectedVendor}
          supplies={selectedVendorSupplies}
          vendorSales={vendorSales}
          vendorCOGS={vendorCOGS || 0}
          onBack={() => setSelectedVendorId(null)}
          onEdit={(v) => {
            setEditingVendorId(v.id);
            setIsVendorModalOpen(true);
          }}
          onDelete={(id) => setVendorToDelete(id)}
          onOpenBulkSupply={() => setIsBulkSupplyModalOpen(true)}
          onOpenNewSupply={() => {
            setEditingSupplyId(null);
            setIsSupplyModalOpen(true);
          }}
          onDeleteSupply={(id) => setSupplyToDelete(id)}
        />
      ) : (
        <div className="flex h-full flex-col gap-4">
          <div className="flex shrink-0 flex-col items-start justify-between rounded-lg bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Vendor & Supply Management
              </h2>
              <p className="text-sm text-gray-500">
                Track inventory purchases and supplier details
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    activeTab === "supplies"
                      ? setIsBulkSupplyModalOpen(true)
                      : setIsBulkVendorModalOpen(true)
                  }
                  className="flex items-center gap-2 rounded-lg bg-pink-100 px-4 py-2 font-medium text-pink-700 shadow-sm transition-colors hover:bg-pink-200"
                >
                  <Layers size={18} />{" "}
                  {activeTab === "supplies" ? "Bulk Supply" : "Bulk Add"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    activeTab === "supplies"
                      ? openNewSupply()
                      : setIsVendorModalOpen(true)
                  }
                  className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-pink-700"
                >
                  <Plus size={18} />{" "}
                  {activeTab === "supplies"
                    ? "Record Supply"
                    : "Add New Vendor"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="flex gap-8 border-b border-gray-100 px-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("supplies")}
                className={`py-4 text-sm font-medium transition-all border-b-2 px-1 ${activeTab === "supplies" ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Supply Log
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vendors")}
                className={`py-4 text-sm font-medium transition-all border-b-2 px-1 ${activeTab === "vendors" ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Vendor Directory
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              {activeTab === "supplies" ? (
                <SupplyLog
                  tableData={tableData}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  onSort={handleSort}
                  onEdit={openEditSupply}
                  onDelete={(id) => setSupplyToDelete(id)}
                />
              ) : (
                <VendorDirectory
                  vendors={vendors}
                  onRowClick={setSelectedVendorId}
                  onEdit={(v) => {
                    setEditingVendorId(v.id);
                    setIsVendorModalOpen(true);
                  }}
                  onDelete={(id) => setVendorToDelete(id)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => {
          setIsVendorModalOpen(false);
          setEditingVendorId(null);
        }}
        onSubmit={handleVendorSubmit}
        editingVendor={vendors.find((v) => v.id === editingVendorId) || null}
        isPending={isPending}
      />

      <BulkVendorModal
        isOpen={isBulkVendorModalOpen}
        onClose={() => setIsBulkVendorModalOpen(false)}
        onUpload={handleBulkVendorUpload}
        existingVendors={vendors}
      />

      <SupplyModal
        isOpen={isSupplyModalOpen}
        onClose={() => {
          setIsSupplyModalOpen(false);
          setEditingSupplyId(null);
        }}
        onSubmit={handleSupplySubmit}
        editingSupplyId={editingSupplyId}
        initialValues={supplyInitialValues}
        isPending={isPending}
        vendors={vendors}
        products={products.map((p) => ({
          ...p,
          lastSupplyDate: p.lastSupplyDate ?? "",
          lowStockThreshold: p.lowStockThreshold ?? 0,
        }))}
      />

      <BulkSupplyModal
        isOpen={isBulkSupplyModalOpen}
        onClose={() => setIsBulkSupplyModalOpen(false)}
        onUpload={handleBulkSupplyUpload}
        getLocalDateStr={getLocalDateStr}
        generatePO={generatePO}
      />

      <DeleteModal
        isOpen={!!supplyToDelete}
        onClose={() => setSupplyToDelete(null)}
        onConfirm={confirmDeleteSupply}
        title="Delete Supply Record?"
        itemName={supplyToDeleteDetails?.productName}
        warningText="This will adjust stock levels."
        isPending={deleteSupplyEntryMutation.isPending}
      />

      <DeleteModal
        isOpen={!!vendorToDelete}
        onClose={() => setVendorToDelete(null)}
        onConfirm={confirmDeleteVendor}
        title="Delete Vendor?"
        itemName={vendorToDeleteDetails?.name}
        warningText={`This will permanently delete this vendor and ALL associated products (${products.filter((p) => p.vendorId === vendorToDelete).length}) and supply records (${supplies.filter((s) => s.vendorId === vendorToDelete).length}). This action cannot be undone.`}
        isPending={deleteVendorMutation.isPending}
      />
    </div>
  );
};

export default VendorPage;
