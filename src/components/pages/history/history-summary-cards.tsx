import { CheckCircle, X } from "lucide-react";
import React from "react";

interface HistorySummaryCardsProps {
  totalSales: number;
  totalDebt: number;
}

export const HistorySummaryCards = ({ totalSales, totalDebt }: HistorySummaryCardsProps) => {
  return (
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
  );
};
