import { Package } from "lucide-react";
import React from "react";

interface TopItem {
  name: string;
  value: number;
}

interface TopSellingItemsProps {
  items: TopItem[];
}

export const TopSellingItems = ({ items }: TopSellingItemsProps) => {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-1">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">
          Top Selling Items
        </h3>
        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
          By Qty
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-sm text-gray-400">
            <Package size={32} className="mb-2 opacity-20" />
            No sales data for this period
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.name}
              className="group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                                w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                                ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : index === 1
                                      ? "bg-gray-100 text-gray-700"
                                      : index === 2
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-purple-50 text-purple-600"
                                }
                            `}
                >
                  {index + 1}
                </div>
                <div>
                  <p
                    className="line-clamp-1 text-sm font-medium text-gray-800"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{
                        width: `${(item.value / items[0].value) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-sm font-bold text-gray-900">
                  {item.value}
                </span>
                <span className="text-[10px] text-gray-400 uppercase">
                  Sold
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
