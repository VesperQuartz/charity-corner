import type { InsertProduct } from "@/repo/schema";

export type PaymentMethod = "CASH" | "TRANSFER" | "POS" | "CREDIT";

export type UserRole = "admin" | "cashier";

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be hashed
  name: string;
  role: UserRole;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  vendorId: string;
  lastSupplyDate?: string;
  lowStockThreshold?: number;
}

export interface CartItem extends InsertProduct {
  quantity: number;
}

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  priceAtSale: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO String
  items: TransactionItem[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashierId: string;
  debtorName?: string;
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "SALE" | "LOGIN" | "LOGOUT";
  entity: "PRODUCT" | "VENDOR" | "SUPPLY" | "TRANSACTION" | "USER" | "SYSTEM";
  entityId?: string;
  details: string;
  performedBy: string; // User ID or Name
}

export interface SupplyEntry {
  id: string;
  date: string;
  vendorId: string;
  productId: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  purchaseOrderNumber: string;
  isPaid: boolean;
}
