"use client";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  DollarSign,
  LoaderCircle,
  Package,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { orpc } from "@/lib/orpc";
import { AnalyticsHeader } from "./analytics/analytics-header";
import { FinancialReportChart } from "./analytics/financial-report-chart";
import { MetricCard } from "./analytics/metric-card";
import { TopSellingItems } from "./analytics/top-selling-items";

const Analytics = () => {
  const productsQuery = useQuery(orpc.getProducts.queryOptions());
  const transactionsQuery = useQuery(orpc.getTransactions.queryOptions());
  const supplyEntriesQuery = useQuery(orpc.getSupplyEntries.queryOptions());

  const products = productsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const supplies = supplyEntriesQuery.data ?? [];

  // Date Range State
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
      <AnalyticsHeader dateRange={dateRange} setDateRange={setDateRange} />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="TOTAL VALUE OF SOLD ITEMS"
          value={totalValueSoldItems}
          icon={DollarSign}
          colorClass="bg-[#D0FFCD] text-green-600"
          subText="Gross revenue for period"
        />
        <MetricCard
          title="TOTAL VALUE OF UNSOLD ITEMS"
          value={totalValueUnsoldItems}
          icon={Package}
          colorClass="bg-[#FFEDCD] text-orange-600"
          subText="Inventory value at end date"
        />
        <MetricCard
          title="VENDOR'S TOTAL SALES"
          value={vendorsTotalSales}
          icon={CreditCard}
          colorClass="bg-[#FFCDCD] text-red-600"
          subText="Supplies purchased in period"
        />
        <MetricCard
          title="TOTAL PROFIT MARGIN"
          value={
            totalValueSoldItems + totalValueUnsoldItems - vendorsTotalSales
          }
          icon={TrendingUp}
          colorClass="bg-[#CDDDFF] text-blue-600"
          isPercentage={false}
          subText="Sold + Unsold - Cost"
        />
        <MetricCard
          title="EXPECTED SALE"
          value={totalValueSoldItems + totalValueUnsoldItems + totalDebtMatrix}
          icon={TrendingUp}
          colorClass="bg-[#CDDDFF] text-blue-600"
          isPercentage={false}
          subText="Expected Profit"
        />
        <MetricCard
          title="TOTAL DEBT"
          value={totalDebtMatrix}
          icon={TrendingDown}
          colorClass="bg-[#FFCDCD] text-red-600"
          isPercentage={false}
          subText="Total Debt Matrix"
        />
      </div>

      {/* Charts Section */}
      <div className="grid min-h-100 flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        <FinancialReportChart data={financialReportData} />
        <TopSellingItems items={topSellingItems} />
      </div>
    </div>
  );
};

export default Analytics;
