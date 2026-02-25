"use client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  CreditCard,
  DollarSign,
  LoaderCircle,
  Package,
  TrendingDown,
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
import { orpc } from "@/lib/orpc";

const Analytics = () => {
  const productsQuery = useQuery(orpc.getProducts.queryOptions());
  const transactionsQuery = useQuery(orpc.getTransactions.queryOptions());
  const supplyEntriesQuery = useQuery(orpc.getSupplyEntries.queryOptions());

  const products = productsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const supplies = supplyEntriesQuery.data ?? [];

  // Date Range State (Matches History page style)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(
    () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;
      return { start: today, end: today };
    },
  );

  // Parsed Date Objects for Filtering
  const dateLimits = useMemo(() => {
    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, [dateRange]);

  // Filtered Data
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= dateLimits.start && d <= dateLimits.end;
    });
  }, [transactions, dateLimits]);

  const filteredSupplies = useMemo(() => {
    return supplies.filter((s) => {
      const d = new Date(s.date);
      return d >= dateLimits.start && d <= dateLimits.end;
    });
  }, [supplies, dateLimits]);

  // --- Key Metrics Calculations ---

  // 1. TOTAL VALUE OF SOLD ITEMS (Gross Revenue)
  const totalValueSoldItems = useMemo(() => {
    return filteredTransactions
      .filter((item) => item.paymentMethod !== "CREDIT")
      .reduce((sum, txn) => sum + txn.total, 0);
  }, [filteredTransactions]);

  const totalDebtMatrix = useMemo(() => {
    return transactions
      .filter((item) => item.paymentMethod === "CREDIT")
      .reduce((sum, txn) => sum + txn.total, 0);
  }, [transactions]);

  // 2. VENDOR'S TOTAL SALES (Total value of supplies purchased in period)
  const vendorsTotalSales = useMemo(() => {
    return filteredSupplies.reduce(
      (sum, s) => sum + s.costPrice * s.quantity,
      0,
    );
  }, [filteredSupplies]);

  // 3. TOTAL VALUE OF UNSOLD ITEMS (Historical Inventory Value)
  const totalValueUnsoldItems = useMemo(() => {
    const stockMap = new Map<string, number>();
    products.forEach((p) => {
      stockMap.set(p.id, p.stock);
    });

    const targetEndTime = dateLimits.end.getTime();

    transactions.forEach((t) => {
      const tTime = new Date(t.date).getTime();
      if (tTime > targetEndTime) {
        t.items.forEach((item) => {
          const current = stockMap.get(item.productId) || 0;
          stockMap.set(item.productId, current + item.quantity);
        });
      }
    });

    supplies.forEach((s) => {
      const sTime = new Date(s.date).getTime();
      if (sTime > targetEndTime) {
        const current = stockMap.get(s.productId) || 0;
        stockMap.set(s.productId, Math.max(0, current - s.quantity));
      }
    });

    let total = 0;
    stockMap.forEach((qty, productId) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        total += qty * product.sellingPrice;
      }
    });

    return total;
  }, [products, transactions, supplies, dateLimits]);

  const financialReportData = useMemo(
    () => [
      {
        id: "sold-value",
        name: "Sold Value",
        value: totalValueSoldItems,
        color: "#10b981",
      },
      {
        id: "vendor-sales",
        name: "Vendor Sales",
        value: vendorsTotalSales,
        color: "#ef4444",
      },
      {
        id: "profit",
        name: "Profit",
        value: totalValueSoldItems + totalValueUnsoldItems - vendorsTotalSales,
        color: "#3b82f6",
      },
      {
        id: "unsold-value",
        name: "Unsold Value",
        value: totalValueUnsoldItems,
        color: "#f97316",
      },
    ],
    [totalValueSoldItems, vendorsTotalSales, totalValueUnsoldItems],
  );

  const topSellingItems = useMemo(() => {
    const itemMap = new Map<string, number>();
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

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    colorClass,
    subText,
    isPercentage,
  }: any) => (
    <div className="flex items-start justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div>
        <p className="mb-1 text-sm font-medium text-gray-500 uppercase">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-gray-800">
          {!isPercentage && "₦"}
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          {isPercentage && "%"}
        </h3>
        {subText && <p className="mt-2 text-xs text-gray-400">{subText}</p>}
      </div>
      <div className={`p-3 rounded-full ${colorClass} opacity-70`}>
        <Icon size={24} className={colorClass.split(" ")[1]} />
      </div>
    </div>
  );

  const isLoading =
    productsQuery.isLoading ||
    transactionsQuery.isLoading ||
    supplyEntriesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-12 w-12 animate-spin text-pink-600 opacity-20" />
          <p className="font-medium text-gray-500">
            Analyzing business data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full animate-in flex-col gap-6 overflow-y-auto pr-2 pb-4 duration-300 fade-in">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Business Analytics
          </h2>
          <p className="text-gray-500">
            Performance from{" "}
            <span className="font-medium text-gray-800">
              {format(parseISO(dateRange.start), "MMM d, yyyy")}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-800">
              {format(parseISO(dateRange.end), "MMM d, yyyy")}
            </span>
          </p>
        </div>

        {/* Date Range Picker (Synced with History page style) */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <div className="relative flex items-center border-r border-gray-100 pr-2">
            <div className="pointer-events-none absolute left-2 text-gray-400">
              <span className="text-[10px] font-bold uppercase">From</span>
            </div>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-32 bg-transparent py-1.5 pr-2 pl-12 text-sm font-medium text-gray-700 focus:outline-none"
            />
          </div>
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-2 text-gray-400">
              <span className="text-[10px] font-bold uppercase">To</span>
            </div>
            <input
              type="date"
              value={dateRange.end}
              min={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-32 bg-transparent py-1.5 pr-2 pl-8 text-sm font-medium text-gray-700 focus:outline-none"
            />
          </div>
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
            <Calendar size={16} />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="TOTAL VALUE OF SOLD ITEMS"
          value={totalValueSoldItems}
          icon={() => <DollarSign />}
          colorClass="bg-[#D0FFCD] text-green-600"
          subText="Gross revenue for period"
        />
        <MetricCard
          title="TOTAL VALUE OF UNSOLD ITEMS"
          value={totalValueUnsoldItems}
          icon={() => <Package />}
          colorClass="bg-[#FFEDCD] text-orange-600"
          subText="Inventory value at end date"
        />
        <MetricCard
          title="VENDOR'S TOTAL SALES"
          value={vendorsTotalSales}
          icon={() => <CreditCard />}
          colorClass="bg-[#FFCDCD] text-red-600"
          subText="Supplies purchased in period"
        />
        <MetricCard
          title="TOTAL PROFIT MARGIN"
          value={
            totalValueSoldItems + totalValueUnsoldItems - vendorsTotalSales
          }
          icon={() => <TrendingUp />}
          colorClass="bg-[#CDDDFF] text-blue-600"
          isPercentage={false}
          subText="Sold + Unsold - Cost"
        />
        <MetricCard
          title="EXPECTED SALE"
          value={totalValueSoldItems + totalValueUnsoldItems}
          icon={() => <TrendingUp className="" />}
          colorClass="bg-[#CDDDFF] text-blue-600"
          isPercentage={false}
          subText="Expected Profit"
        />
        <MetricCard
          title="TOTAL DEBT"
          value={totalDebtMatrix}
          icon={() => <TrendingDown className="" />}
          colorClass="bg-[#FFCDCD] text-red-600"
          isPercentage={false}
          subText="Total Debt Matrix"
        />
      </div>

      {/* Charts Section */}
      <div className="grid min-h-100 flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Report Chart */}
        <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-6 text-lg font-bold text-gray-800">
            Financial Comparison
          </h3>
          <div className="min-h-75 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={financialReportData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#4b5563", fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(value) => `₦${value}`}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number | undefined) => [
                    `₦${value?.toLocaleString() ?? 0}`,
                    "Value",
                  ]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                  {financialReportData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
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
