import { CheckCircle, LoaderCircle } from "lucide-react";
import React from "react";
import { Transaction } from "@/types";

interface HistoryTransactionLogProps {
  isLoading: boolean;
  displayedTransactions: Transaction[];
  activeTab: "log" | "debtors" | "summary";
  getCashierName: (id: string) => string;
  handleMarkAsPaid: (txn: Transaction) => void;
}

export const HistoryTransactionLog = ({
  isLoading,
  displayedTransactions,
  activeTab,
  getCashierName,
  handleMarkAsPaid,
}: HistoryTransactionLogProps) => {
  return (
    <table className="w-full text-left text-sm text-gray-500">
      <thead className="sticky top-0 bg-gray-50 text-xs text-gray-700 uppercase">
        <tr>
          <th className="px-6 py-3">ID</th>
          <th className="px-6 py-3">Date</th>
          <th className="px-6 py-3">Time</th>
          <th className="px-6 py-3">Cashier</th>
          {activeTab === "debtors" && <th className="px-6 py-3">Debtor</th>}
          <th className="px-6 py-3">Items</th>
          <th className="px-6 py-3 text-center">Quantity</th>
          <th className="px-6 py-3 text-right">Total</th>
          <th className="px-6 py-3 text-center">Method</th>
          {activeTab === "debtors" && <th className="px-6 py-3 text-center">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={10} className="p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <LoaderCircle className="mb-4 animate-spin opacity-20" size={48} />
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
            <tr key={txn.id} className="border-b bg-white hover:bg-gray-50">
              <td className="px-6 py-4 align-top font-medium whitespace-nowrap text-gray-900">
                #{txn.id.slice(-6)}
              </td>
              <td className="px-6 py-4 align-top whitespace-nowrap">
                <span className="font-medium">{new Date(txn.date).toLocaleDateString()}</span>
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
                    <span key={crypto.randomUUID()} className="text-sm text-gray-800">
                      {i.name}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 text-center align-top">
                <div className="flex flex-col gap-1">
                  {txn.items.map((i) => (
                    <span key={crypto.randomUUID()} className="font-mono text-sm text-gray-600">
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
  );
};
