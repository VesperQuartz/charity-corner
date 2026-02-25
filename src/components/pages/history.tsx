"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, CheckCircle, LoaderCircle, X } from "lucide-react";
import React, { Activity } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { orpc } from "@/lib/orpc";
import type { Transaction } from "@/types";

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
      {/* Header Controls */}
      <div className="flex flex-col items-start justify-between rounded-lg bg-white p-4 shadow-sm md:flex-row md:items-center">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          Sales History
        </h2>

        <div className="mt-4 flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center md:mt-0 md:w-auto">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-2 text-gray-400">
                <span className="text-xs font-medium">From</span>
              </div>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-32 bg-transparent py-1.5 pr-2 pl-10 text-sm text-gray-700 focus:outline-none"
              />
            </div>
            <div className="text-gray-400">-</div>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-2 text-gray-400">
                <span className="text-xs font-medium">To</span>
              </div>
              <input
                type="date"
                value={dateRange.end}
                min={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-32 bg-transparent py-1.5 pr-2 pl-8 text-sm text-gray-700 focus:outline-none"
              />
            </div>
            {(dateRange.start || dateRange.end) && (
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
                <Calendar size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border-l-4 border-green-500 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Sales (Realized)
            </p>
            <h3 className="mt-1 text-2xl font-bold text-gray-800">
              ₦{totalSales.toFixed(2)}
            </h3>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle size={20} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border-l-4 border-red-500 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Outstanding Debt (Unrealized)
            </p>
            <h3 className="mt-1 text-2xl font-bold text-gray-800">
              ₦{totalDebt.toFixed(2)}
            </h3>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <X size={20} />
          </div>
        </div>
      </div>

      {/* Tabs & Table Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex gap-8 border-b border-gray-100 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("log")}
            className={`py-4 text-sm font-medium transition-all border-b-2 px-1 ${activeTab === "log" ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Transaction Log
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("debtors")}
            className={`py-4 text-sm font-medium transition-all border-b-2 px-1 ${activeTab === "debtors" ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Debtors / Credit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`py-4 text-sm font-medium transition-all border-b-2 px-1 ${activeTab === "summary" ? "border-pink-600 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Transaction Summary
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === "log" || activeTab === "debtors" ? (
            /* --- Transaction Log & Debtors View --- */
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-700 uppercase">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Cashier</th>
                  {activeTab === "debtors" && (
                    <th className="px-6 py-3">Debtor</th>
                  )}
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3 text-center">Quantity</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center">Method</th>
                  {activeTab === "debtors" && (
                    <th className="px-6 py-3 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {transactionsQuery.isLoading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <LoaderCircle
                          className="mb-4 animate-spin opacity-20"
                          size={48}
                        />
                        <p className="text-lg">Loading history...</p>
                      </div>
                    </td>
                  </tr>
                ) : displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center">
                      {activeTab === "debtors"
                        ? "No outstanding debtors found"
                        : "No transactions found for this period"}
                    </td>
                  </tr>
                ) : (
                  displayedTransactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="border-b bg-white hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 align-top font-medium whitespace-nowrap text-gray-900">
                        #{txn.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 align-top whitespace-nowrap">
                        <span className="font-medium">
                          {new Date(txn.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top font-mono whitespace-nowrap text-gray-500">
                        {new Date(txn.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {getCashierName(txn.cashierId)}
                        </span>
                      </td>
                      {activeTab === "debtors" && (
                        <td className="px-6 py-4 align-top">
                          <span className="text-sm font-medium text-gray-800">
                            {txn.debtorName || "-"}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          {txn.items.map((i) => (
                            <span
                              key={crypto.randomUUID()}
                              className="text-sm text-gray-800"
                            >
                              {i.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center align-top">
                        <div className="flex flex-col gap-1">
                          {txn.items.map((i) => (
                            <span
                              key={crypto.randomUUID()}
                              className="font-mono text-sm text-gray-600"
                            >
                              x{i.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right align-top font-mono font-bold text-green-600">
                        ₦{txn.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center align-top">
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded border ${
                            txn.paymentMethod === "CREDIT"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }`}
                        >
                          {txn.paymentMethod}
                        </span>
                      </td>
                      {activeTab === "debtors" && (
                        <td className="px-6 py-4 text-center align-top">
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkAsPaid({
                                ...txn,
                                debtorName: txn.debtorName ?? "",
                              })
                            }
                            className="mx-auto flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800"
                            title="Mark as Paid"
                          >
                            <CheckCircle size={12} /> Pay
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* --- Transaction Summary View --- */
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-700 uppercase">
                <tr>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3 text-center">Total Quantity</th>
                  <th className="px-6 py-3 text-right">Total (₦)</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center">
                      No sales found for this period
                    </td>
                  </tr>
                ) : (
                  summaryData.map((item) => (
                    <tr
                      key={crypto.randomUUID()}
                      className="border-b bg-white hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">
                        ₦{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Summary Footer */}
                {summaryData.length > 0 && (
                  <>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold text-gray-700">
                      <td className="px-6 py-3 text-sm">
                        Gross Total (Value of Goods)
                      </td>
                      <td className="px-6 py-3 text-center text-sm">
                        {totalItemsSold}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-base">
                        ₦{grandTotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-red-50 font-medium text-red-700">
                      <td colSpan={2} className="px-6 py-2 text-left text-sm">
                        Less: Outstanding Debt (Credit)
                      </td>
                      <td className="px-6 py-2 text-right font-mono text-base">
                        -₦{totalDebt.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t border-green-200 bg-green-50 font-bold text-green-800">
                      <td colSpan={2} className="px-6 py-4 text-left text-base">
                        NET REALIZED SALES
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xl">
                        ₦{totalSales.toFixed(2)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPayModal && selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm animate-in overflow-hidden rounded-xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle size={24} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Confirm Payment
              </h3>
              <p className="mb-6 text-gray-500">
                Has{" "}
                <span className="font-bold text-gray-800">
                  {selectedTxn.debtorName}
                </span>{" "}
                paid their debt of{" "}
                <span className="font-bold text-green-600">
                  ₦{selectedTxn.total.toFixed(2)}
                </span>
                ?
              </p>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedTxn(null);
                  }}
                  className="flex-1 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={confirmPayment}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-green-700"
                >
                  Confirm Paid
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

export default History;
