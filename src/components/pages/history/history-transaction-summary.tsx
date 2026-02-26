import React from "react";

interface SummaryItem {
  name: string;
  quantity: number;
  total: number;
}

interface HistoryTransactionSummaryProps {
  summaryData: SummaryItem[];
  totalItemsSold: number;
  grandTotal: number;
  totalDebt: number;
  totalSales: number;
}

export const HistoryTransactionSummary = ({
  summaryData,
  totalItemsSold,
  grandTotal,
  totalDebt,
  totalSales,
}: HistoryTransactionSummaryProps) => {
  return (
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
            <tr key={crypto.randomUUID()} className="border-b bg-white hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
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
              <td className="px-6 py-3 text-sm">Gross Total (Value of Goods)</td>
              <td className="px-6 py-3 text-center text-sm">{totalItemsSold}</td>
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
  );
};
