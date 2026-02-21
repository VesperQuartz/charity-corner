"use client";
import {
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/context/StoreContext";

const Analytics = () => {
  const { transactions, products, supplies } = useStore();

  // State for Month Filter (YYYY-MM)
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Calculate Date Range
  const dateRange = useMemo(() => {
    const [year, month] = monthFilter.split("-").map(Number);
    // Start: 1st of month 00:00:00
    const start = new Date(year, month - 1, 1);
    // End: Last day of month 23:59:59.999
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }, [monthFilter]);

  // --- 1. Key Metrics Calculations (Filtered) ---

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [transactions, dateRange]);

  // Filtered Supplies
  const filteredSupplies = useMemo(() => {
    return supplies.filter((s) => {
      return s.date.startsWith(monthFilter);
    });
  }, [supplies, monthFilter]);

  // 1. TOTAL VALUE OF SOLD ITEMS (Gross Revenue)
  const totalValueSoldItems = useMemo(() => {
    return filteredTransactions.reduce((sum, txn) => sum + txn.total, 0);
  }, [filteredTransactions]);

  // 2. VENDOR'S TOTAL SALES (Total Supplies Purchased / Expenses)
  // This represents what the business bought from vendors
  const vendorsTotalSales = useMemo(() => {
    return filteredSupplies.reduce(
      (sum, s) => sum + s.costPrice * s.quantity,
      0,
    );
  }, [filteredSupplies]);

  // Helper: Cost of Goods Sold (COGS) - Needed for Profit Margin
  const totalCOGS = useMemo(() => {
    return filteredTransactions.reduce((acc, txn) => {
      const txnCost = txn.items.reduce((itemAcc, item) => {
        const product = products.find((p) => p.id === item.productId);
        const cost = product ? product.costPrice : 0;
        return itemAcc + cost * item.quantity;
      }, 0);
      return acc + txnCost;
    }, 0);
  }, [filteredTransactions, products]);

  // 3. TOTAL PROFIT MARGIN (%)
  // Formula: ((Revenue - COGS) / Revenue) * 100
  const totalProfitMargin = useMemo(() => {
    if (totalValueSoldItems === 0) return 0;
    const profit = totalValueSoldItems - totalCOGS;
    return (profit / totalValueSoldItems) * 100;
  }, [totalValueSoldItems, totalCOGS]);

  // 4. TOTAL VALUE OF UNSOLD ITEMS (Historical Inventory Value)
  const totalValueUnsoldItems = useMemo(() => {
    // 1. Start with current stock
    const stockMap = new Map<string, number>();
    products.forEach((p) => stockMap.set(p.id, p.stock));

    // 2. Rollback to the end of selected month
    const targetEndTime = dateRange.end.getTime();

    // Reverse Sales happened AFTER target month
    transactions.forEach((t) => {
      const tTime = new Date(t.date).getTime();
      if (tTime > targetEndTime) {
        t.items.forEach((item) => {
          const current = stockMap.get(item.productId) || 0;
          stockMap.set(item.productId, current + item.quantity);
        });
      }
    });

    // Reverse Supplies happened AFTER target month
    supplies.forEach((s) => {
      const sTime = new Date(s.date).getTime();
      if (sTime > targetEndTime) {
        const current = stockMap.get(s.productId) || 0;
        stockMap.set(s.productId, Math.max(0, current - s.quantity));
      }
    });

    // 3. Calculate Value
    let total = 0;
    stockMap.forEach((qty, productId) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        total += qty * product.sellingPrice;
      }
    });

    return total;
  }, [products, transactions, supplies, dateRange]);

  // --- 2. Chart Data Preparation ---

  //   const financialReportData = useMemo(() => [
  //     { name: 'Realized Revenue', value: totalRealizedRevenue, color: '#10b981' },   // Green
  //     { name: 'Cost of Sales', value: totalRealizedCOGS, color: '#ef4444' }, // Red
  //     { name: 'Realized Profit', value: totalRealizedProfit, color: '#3b82f6' },  // Blue
  //     { name: 'Unsold Stock', value: totalUnsoldValue, color: '#f97316' } // Orange
  //   ], [totalRealizedRevenue, totalRealizedCOGS, totalRealizedProfit, totalUnsoldValue]);

  const topSellingItems = useMemo(() => {
    const itemMap = new Map<string, number>();

    // Use realized transactions for top selling items if we want to align with revenue
    // Or keep all transactions? Usually "Top Selling" includes credit sales.
    // Let's stick to filteredTransactions (all sales) for item popularity,
    // but revenue metrics are realized.
    filteredTransactions.forEach((txn) => {
      txn.items.forEach((item) => {
        const current = itemMap.get(item.name) || 0;
        itemMap.set(item.name, current + item.quantity);
      });
    });

    return Array.from(itemMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredTransactions]);

  // --- Helper Components ---
  const MetricCard = ({
    title,
    value,
    icon: Icon,
    colorClass,
    subText,
  }: any) => (
    <div className="flex items-start justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div>
        <p className="mb-1 text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">
          ₦
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
        {subText && <p className="mt-2 text-xs text-gray-400">{subText}</p>}
      </div>
      <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
        <Icon size={24} className={colorClass.replace("bg-", "text-")} />
      </div>
    </div>
  );

  return (
    <div className="flex h-full animate-in flex-col gap-6 overflow-y-auto pr-2 pb-4 duration-300 fade-in">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Business Analytics
          </h2>
          <p className="text-gray-500">
            Financial performance report for{" "}
            <span className="font-medium text-gray-800">
              {new Date(dateRange.start).toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          <Calendar size={18} className="ml-2 text-gray-500" />
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="cursor-pointer border-none bg-transparent font-medium text-gray-700 outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* Metrics Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
            title="Net Realized Revenue" 
            value={totalRealizedRevenue} 
            icon={DollarSign} 
            colorClass="bg-green-500 text-green-600"
            subText="Cash/POS/Transfer sales (Excl. Credit)"
        />
        <MetricCard 
            title="Cost of Sales" 
            value={totalRealizedCOGS} 
            icon={CreditCard} 
            colorClass="bg-red-500 text-red-600"
            subText="COGS for realized sales"
        />
        <MetricCard 
            title="Realized Profit" 
            value={totalRealizedProfit} 
            icon={TrendingUp} 
            colorClass="bg-blue-500 text-blue-600"
            subText="Realized Revenue - COGS"
        />
        <MetricCard 
            title="Unsold Inventory" 
            value={totalUnsoldValue} 
            icon={Package} 
            colorClass="bg-orange-500 text-orange-600"
            subText="Stock value at end of month"
        />
      </div> */}

      {/* Charts Section */}
      <div className="grid min-h-[400px] flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Report Chart */}
        <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-6 text-lg font-bold text-gray-800">
            Sales Report ({monthFilter})
          </h3>
          <div className="min-h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <div></div>
              {/* <BarChart data={financialReportData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#4b5563', fontSize: 12, fontWeight: 500}} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#9ca3af', fontSize: 12}} 
                            tickFormatter={(value) => `₦${value}`} 
                        />
                        <Tooltip 
                            cursor={{fill: '#f3f4f6'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Value']}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                            {financialReportData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart> */}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Items List */}
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
            {topSellingItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-sm text-gray-400">
                <Package size={32} className="mb-2 opacity-20" />
                No sales data for this period
              </div>
            ) : (
              topSellingItems.map((item, index) => (
                <div
                  key={index}
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
                            width: `${(item.value / topSellingItems[0].value) * 100}%`,
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
      </div>
    </div>
  );
};

export default Analytics;
