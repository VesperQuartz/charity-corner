import React, { createContext, useContext, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "../lib/orpc";
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIES,
  INITIAL_TRANSACTIONS,
  INITIAL_VENDORS,
} from "../constants";

import {
  EventLogEntry,
  Product,
  SupplyEntry,
  Transaction,
  Vendor,
} from "../types";

interface StoreContextType {
  products: Product[];
  vendors: Vendor[];
  transactions: Transaction[];
  supplies: SupplyEntry[];
  eventLogs: EventLogEntry[];
  addProduct: (product: Product, performedBy?: string) => void;
  updateProduct: (product: Product, performedBy?: string) => void;
  addVendor: (vendor: Vendor, performedBy?: string) => void;
  updateVendor: (vendor: Vendor, performedBy?: string) => void;
  deleteVendor: (id: string, performedBy?: string) => void;
  processTransaction: (transaction: Transaction, performedBy?: string) => void;
  updateTransaction: (transaction: Transaction, performedBy?: string) => void;
  addSupplyEntry: (entry: SupplyEntry, performedBy?: string) => void;
  updateSupplyEntry: (entry: SupplyEntry, performedBy?: string) => void;
  deleteSupplyEntry: (id: string, performedBy?: string) => void;
  logEvent: (
    action: EventLogEntry["action"],
    entity: EventLogEntry["entity"],
    details: string,
    entityId?: string,
    performedBy?: string,
  ) => void;
  refreshData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Versioning keys to allow schema/data updates
// Keys updated for Charity Corner POS branding
const KEYS = {
  PRODUCTS: "charity_corner_products_v4",
  VENDORS: "charity_corner_vendors_v4",
  TRANSACTIONS: "charity_corner_transactions_v4",
  SUPPLIES: "charity_corner_supplies_v4",
  EVENT_LOGS: "charity_corner_event_logs_v1",
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [supplies, setSupplies] = useState<SupplyEntry[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLogEntry[]>([]);

  const createEventLogMutation = useMutation(orpc.createEventLog.mutationOptions());

  // Load initial data
  useEffect(() => {
    const loadData = () => {
      const storedProducts = localStorage.getItem(KEYS.PRODUCTS);
      const storedVendors = localStorage.getItem(KEYS.VENDORS);
      const storedTxns = localStorage.getItem(KEYS.TRANSACTIONS);
      const storedSupplies = localStorage.getItem(KEYS.SUPPLIES);
      const storedLogs = localStorage.getItem(KEYS.EVENT_LOGS);

      setProducts(
        storedProducts ? JSON.parse(storedProducts) : INITIAL_PRODUCTS,
      );
      setVendors(storedVendors ? JSON.parse(storedVendors) : INITIAL_VENDORS);
      setTransactions(
        storedTxns ? JSON.parse(storedTxns) : INITIAL_TRANSACTIONS,
      );
      setSupplies(
        storedSupplies ? JSON.parse(storedSupplies) : INITIAL_SUPPLIES,
      );
      setEventLogs(storedLogs ? JSON.parse(storedLogs) : []);
    };
    loadData();
  }, []);

  const persist = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const logEvent = (
    action: EventLogEntry["action"],
    entity: EventLogEntry["entity"],
    details: string,
    entityId?: string,
    performedBy: string = "System",
  ) => {
    createEventLogMutation.mutate({
      action,
      entity,
      details,
      entityId,
      performedBy,
    });

    // Also keep local state for now if legacy components still rely on it for immediate display,
    // though ideally they should use the getEventLogs query.
    const newLog: EventLogEntry = {
      id: `log_temp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      details,
      performedBy,
    };
    setEventLogs((prev) => [newLog, ...prev]);
  };

  const addProduct = (product: Product, performedBy?: string) => {
    setProducts((prev) => {
      const updated = [...prev, product];
      persist(KEYS.PRODUCTS, updated);
      return updated;
    });
    logEvent(
      "CREATE",
      "PRODUCT",
      `Added product: ${product.name}`,
      product.id,
      performedBy,
    );
  };

  const updateProduct = (product: Product, performedBy?: string) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === product.id ? product : p));
      persist(KEYS.PRODUCTS, updated);
      return updated;
    });
    logEvent(
      "UPDATE",
      "PRODUCT",
      `Updated product: ${product.name}`,
      product.id,
      performedBy,
    );
  };

  const addVendor = (vendor: Vendor, performedBy?: string) => {
    setVendors((prev) => {
      const updated = [...prev, vendor];
      persist(KEYS.VENDORS, updated);
      return updated;
    });
    logEvent(
      "CREATE",
      "VENDOR",
      `Added vendor: ${vendor.name}`,
      vendor.id,
      performedBy,
    );
  };

  const updateVendor = (vendor: Vendor, performedBy?: string) => {
    setVendors((prev) => {
      const updated = prev.map((v) => (v.id === vendor.id ? vendor : v));
      persist(KEYS.VENDORS, updated);
      return updated;
    });
    logEvent(
      "UPDATE",
      "VENDOR",
      `Updated vendor: ${vendor.name}`,
      vendor.id,
      performedBy,
    );
  };

  const deleteVendor = (id: string, performedBy?: string) => {
    const vendor = vendors.find((v) => v.id === id);
    setVendors((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      persist(KEYS.VENDORS, updated);
      return updated;
    });
    logEvent(
      "DELETE",
      "VENDOR",
      `Deleted vendor: ${vendor?.name || id}`,
      id,
      performedBy,
    );
  };

  const processTransaction = (
    transaction: Transaction,
    performedBy?: string,
  ) => {
    // 1. Add Transaction
    setTransactions((prev) => {
      const updated = [transaction, ...prev];
      persist(KEYS.TRANSACTIONS, updated);
      return updated;
    });

    // 2. Update Stock
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const itemSold = transaction.items.find((i) => i.productId === p.id);
        if (itemSold) {
          return { ...p, stock: Math.max(0, p.stock - itemSold.quantity) };
        }
        return p;
      });
      persist(KEYS.PRODUCTS, updated);
      return updated;
    });

    logEvent(
      "SALE",
      "TRANSACTION",
      `Processed transaction #${transaction.id} - Total: ${transaction.total}`,
      transaction.id,
      performedBy || transaction.cashierId,
    );
  };

  const updateTransaction = (
    transaction: Transaction,
    performedBy?: string,
  ) => {
    setTransactions((prev) => {
      const updated = prev.map((t) =>
        t.id === transaction.id ? transaction : t,
      );
      persist(KEYS.TRANSACTIONS, updated);
      return updated;
    });
    logEvent(
      "UPDATE",
      "TRANSACTION",
      `Updated transaction #${transaction.id}`,
      transaction.id,
      performedBy,
    );
  };

  const addSupplyEntry = (entry: SupplyEntry, performedBy?: string) => {
    // 1. Add Entry History
    setSupplies((prev) => {
      const updated = [...prev, entry];
      persist(KEYS.SUPPLIES, updated);
      return updated;
    });

    // 2. Update Product Stock & Prices
    setProducts((prev) => {
      const existingProductIndex = prev.findIndex(
        (p) => p.id === entry.productId,
      );

      if (existingProductIndex >= 0) {
        // Update existing
        const updatedProducts = [...prev];
        const p = updatedProducts[existingProductIndex];
        updatedProducts[existingProductIndex] = {
          ...p,
          stock: p.stock + entry.quantity,
          costPrice: entry.costPrice,
          sellingPrice: entry.sellingPrice,
          lastSupplyDate: entry.date,
          vendorId: entry.vendorId,
        };
        persist(KEYS.PRODUCTS, updatedProducts);
        return updatedProducts;
      }
      return prev;
    });

    logEvent(
      "CREATE",
      "SUPPLY",
      `Added supply entry for product ID: ${entry.productId}, Qty: ${entry.quantity}`,
      entry.id,
      performedBy,
    );
  };

  const updateSupplyEntry = (newEntry: SupplyEntry, performedBy?: string) => {
    // We need the old entry to calculate diff.
    // Since this runs in an event handler, 'supplies' state might be sufficient,
    // but using functional update on supplies to find it is safer if multiple updates happened.
    // However, finding oldEntry inside setSupplies and then updating products is complex because products needs setProducts.
    // We'll rely on current 'supplies' closure state for finding oldEntry, assuming edit is user-driven and not batched with other supply updates.

    const oldEntry = supplies.find((s) => s.id === newEntry.id);
    if (!oldEntry) return;

    setProducts((prev) => {
      let updatedProducts = [...prev];

      // Logic to adjust stock based on the edit
      // Case 1: Product changed (rare, but possible if user selected wrong item)
      if (oldEntry.productId !== newEntry.productId) {
        // Revert old product stock
        const oldProdIdx = updatedProducts.findIndex(
          (p) => p.id === oldEntry.productId,
        );
        if (oldProdIdx >= 0) {
          updatedProducts[oldProdIdx] = {
            ...updatedProducts[oldProdIdx],
            stock: Math.max(
              0,
              updatedProducts[oldProdIdx].stock - oldEntry.quantity,
            ),
          };
        }
        // Apply to new product
        const newProdIdx = updatedProducts.findIndex(
          (p) => p.id === newEntry.productId,
        );
        if (newProdIdx >= 0) {
          updatedProducts[newProdIdx] = {
            ...updatedProducts[newProdIdx],
            stock: updatedProducts[newProdIdx].stock + newEntry.quantity,
            costPrice: newEntry.costPrice,
            sellingPrice: newEntry.sellingPrice,
          };
        }
      } else {
        // Case 2: Same product, adjust diff
        const prodIdx = updatedProducts.findIndex(
          (p) => p.id === newEntry.productId,
        );
        if (prodIdx >= 0) {
          const diff = newEntry.quantity - oldEntry.quantity;
          updatedProducts[prodIdx] = {
            ...updatedProducts[prodIdx],
            stock: Math.max(0, updatedProducts[prodIdx].stock + diff),
            costPrice: newEntry.costPrice,
            sellingPrice: newEntry.sellingPrice,
          };
        }
      }
      persist(KEYS.PRODUCTS, updatedProducts);
      return updatedProducts;
    });

    setSupplies((prev) => {
      const updated = prev.map((s) => (s.id === newEntry.id ? newEntry : s));
      persist(KEYS.SUPPLIES, updated);
      return updated;
    });

    logEvent(
      "UPDATE",
      "SUPPLY",
      `Updated supply entry ${newEntry.id}`,
      newEntry.id,
      performedBy,
    );
  };

  const deleteSupplyEntry = (id: string, performedBy?: string) => {
    const entry = supplies.find((s) => s.id === id);
    if (!entry) return;

    // Check if there are other supplies for this product
    const otherSuppliesCount = supplies.filter(
      (s) => s.productId === entry.productId && s.id !== id,
    ).length;

    // Revert stock or remove product
    setProducts((prev) => {
      const prodIndex = prev.findIndex((p) => p.id === entry.productId);
      if (prodIndex >= 0) {
        // If no other supplies exist, remove the product entirely from inventory
        if (otherSuppliesCount === 0) {
          const updatedProducts = prev.filter((p) => p.id !== entry.productId);
          persist(KEYS.PRODUCTS, updatedProducts);
          return updatedProducts;
        }

        const updatedProducts = [...prev];
        updatedProducts[prodIndex] = {
          ...updatedProducts[prodIndex],
          stock: Math.max(0, updatedProducts[prodIndex].stock - entry.quantity),
        };
        persist(KEYS.PRODUCTS, updatedProducts);
        return updatedProducts;
      }
      return prev;
    });

    setSupplies((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      persist(KEYS.SUPPLIES, updated);
      return updated;
    });

    logEvent("DELETE", "SUPPLY", `Deleted supply entry ${id}`, id, performedBy);
  };

  const refreshData = () => {
    // Force re-read if needed
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        vendors,
        transactions,
        supplies,
        eventLogs,
        addProduct,
        updateProduct,
        addVendor,
        updateVendor,
        deleteVendor,
        processTransaction,
        updateTransaction,
        addSupplyEntry,
        updateSupplyEntry,
        deleteSupplyEntry,
        logEvent,
        refreshData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
