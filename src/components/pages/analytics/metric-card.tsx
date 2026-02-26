import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  subText?: string;
  isPercentage?: boolean;
}

export const MetricCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
  subText,
  isPercentage,
}: MetricCardProps) => (
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
