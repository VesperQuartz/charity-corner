import {
  createProduct,
  getProducts,
  updateProduct,
} from "@/lib/orpc/router/products";
import { createEventLog, getEventLogs } from "@/lib/orpc/router/event-log";
import {
  createSupplyEntry,
  deleteSupplyEntry,
  getSupplyEntries,
  updateSupplyEntry,
} from "@/lib/orpc/router/supply-entries";
import {
  createTransaction,
  getTransactions,
  updateTransaction,
} from "@/lib/orpc/router/transactions";
import { createTodo, getTodo } from "@/lib/orpc/router/todo";
import {
  createVendor,
  deleteVendor,
  getVendors,
  updateVendor,
} from "@/lib/orpc/router/vendors";

export default {
  createTodo,
  getTodo,
  getProducts,
  getEventLogs,
  createEventLog,
  createProduct,
  updateProduct,
  createTransaction,
  getTransactions,
  updateTransaction,
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getSupplyEntries,
  createSupplyEntry,
  updateSupplyEntry,
  deleteSupplyEntry,
};
