"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { orpc } from "@/lib/orpc";
import type { Transaction } from "@/types";
import { HistoryHeader } from "./history/history-header";
import { HistorySummaryCards } from "./history/history-summary-cards";
import { HistoryTransactionLog } from "./history/history-transaction-log";
import { HistoryTransactionSummary } from "./history/history-transaction-summary";
import { PaymentConfirmationModal } from "./history/payment-confirmation-modal";

const History = () => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = React.useTransition();
  const transactionsQuery = useQuery(orpc.getTransactions.queryOptions());
  const { users } = useAuth();

  const updateTransactionMutation = useMutation(
    orpc.updateTransaction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getTransactions.queryKey(),
        });
        toast.success("Transaction updated successfully");
        setShowPayModal(false);
        setSelectedTxn(null);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to update transaction",
        );
      },
    }),
  );

  const transactions = transactionsQuery.data ?? [];

  // Default to today's date for both start and end
  const [dateRange, setDateRange] = React.useState<{
    start: string;
    end: string;
  }>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;
    return { start: today, end: today };
  });

  const [activeTab, setActiveTab] = React.useState<
    "log" | "debtors" | "summary"
  >("log");
  const [showPayModal, setShowPayModal] = React.useState(false);
  const [selectedTxn, setSelectedTxn] = React.useState<Transaction | null>(
    null,
  );

  // Helper to resolve cashier name
  const getCashierName = (id: string) => {
    if (id === "current_user") return "System"; // Legacy or default
    const user = users.find((u) => u.id === id);
    return user ? user.name : "Unknown";
  };

  // Filter Logic - based on date range
  const filteredTransactions = React.useMemo(() => {
    if (!dateRange.start || !dateRange.end) {
      return transactions;
    }

    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }, [transactions, dateRange]);

  // Separate transactions based on tab logic
  const displayedTransactions = React.useMemo(() => {
    if (activeTab === "debtors") {
      // Show credit transactions for the selected range
      return filteredTransactions.filter((t) => t.paymentMethod === "CREDIT");
    }

    if (activeTab === "log") {
      // Show non-credit transactions for the selected range
      return filteredTransactions.filter((t) => t.paymentMethod !== "CREDIT");
    }

    return filteredTransactions;
  }, [activeTab, filteredTransactions]);

  // Summary Logic (based on filteredTransactions for the range)
  const summaryData = React.useMemo(() => {
    const map = new Map<
      string,
      { name: string; quantity: number; total: number }
    >();

    filteredTransactions.forEach((txn) => {
      txn.items.forEach((item) => {
        // Grouping by name to aggregate same items sold in different transactions
        const key = item.name;
        const itemTotal = item.priceAtSale * item.quantity;
        const existing = map.get(key);

        if (existing) {
          existing.quantity += item.quantity;
          existing.total += itemTotal;
        } else {
          map.set(key, {
            name: item.name,
            quantity: item.quantity,
            total: itemTotal,
          });
        }
      });
    });

    // Sort by total value descending
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  const grandTotal = React.useMemo(() => {
    return summaryData.reduce((acc, curr) => acc + curr.total, 0);
  }, [summaryData]);

  const totalItemsSold = React.useMemo(() => {
    return summaryData.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [summaryData]);

  // Calculate Total Sales (Realized) and Total Debt (Unrealized) based on filteredTransactions
  const { totalSales, totalDebt } = React.useMemo(() => {
    let sales = 0;
    let debt = 0;

    filteredTransactions.forEach((t) => {
      if (t.paymentMethod === "CREDIT") {
        debt += t.total;
      } else {
        sales += t.total;
      }
    });

    return { totalSales: sales, totalDebt: debt };
  }, [filteredTransactions]);

  const handleMarkAsPaid = (txn: Transaction) => {
    setSelectedTxn(txn);
    setShowPayModal(true);
  };

  const confirmPayment = () => {
    if (selectedTxn) {
      startTransition(async () => {
        await updateTransactionMutation.mutateAsync({
          id: selectedTxn.id,
          paymentMethod: "CASH",
        });
      });
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <HistoryHeader dateRange={dateRange} setDateRange={setDateRange} />

      <HistorySummaryCards totalSales={totalSales} totalDebt={totalDebt} />

      {/* Tabs & Table Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex gap-8 border-b border-gray-100 px-6 pt-2">
          {["log", "debtors", "summary"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 text-sm font-medium transition-all border-b-2 px-1 capitalize ${activeTab === tab ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {tab === "log"
                ? "Transaction Log"
                : tab === "debtors"
                  ? "Debtors / Credit"
                  : "Transaction Summary"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === "log" || activeTab === "debtors" ? (
            <HistoryTransactionLog
              isLoading={transactionsQuery.isLoading}
              displayedTransactions={displayedTransactions.map((txn) => ({
                ...txn,
                debtorName: txn.debtorName ?? "Unknown",
              }))}
              activeTab={activeTab}
              getCashierName={getCashierName}
              handleMarkAsPaid={handleMarkAsPaid}
            />
          ) : (
            <HistoryTransactionSummary
              summaryData={summaryData}
              totalItemsSold={totalItemsSold}
              grandTotal={grandTotal}
              totalDebt={totalDebt}
              totalSales={totalSales}
            />
          )}
        </div>
      </div>

      {showPayModal && selectedTxn && (
        <PaymentConfirmationModal
          selectedTxn={selectedTxn}
          isPending={isPending}
          onCancel={() => {
            setShowPayModal(false);
            setSelectedTxn(null);
          }}
          onConfirm={confirmPayment}
        />
      )}
    </div>
  );
};

export default History;
