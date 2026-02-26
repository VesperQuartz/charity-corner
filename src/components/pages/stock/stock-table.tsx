import { Edit2, LoaderCircle, Package } from "lucide-react";
import React from "react";
import { Product } from "@/types";

interface StockTableProps {
  isLoading: boolean;
  products: Product[];
  sortKey: string;
  setSortKey: (key: any) => void;
  getVendorName: (id: string) => string;
  isAdmin: boolean;
  handleEditClick: (p: Product) => void;
}

export const StockTable = ({
  isLoading,
  products,
  sortKey,
  setSortKey,
  getVendorName,
  isAdmin,
  handleEditClick,
}: StockTableProps) => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-gray-500">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th
                className="cursor-pointer px-6 py-4 font-semibold tracking-wider transition-colors hover:bg-gray-100"
                onClick={() => setSortKey("vendor")}
              >
                Vendor Name {sortKey === "vendor" && "↓"}
              </th>
              <th
                className="cursor-pointer px-6 py-4 font-semibold tracking-wider transition-colors hover:bg-gray-100"
                onClick={() => setSortKey("name")}
              >
                Item Name {sortKey === "name" && "↓"}
              </th>
              <th
                className="cursor-pointer px-6 py-4 font-semibold tracking-wider transition-colors hover:bg-gray-100"
                onClick={() => setSortKey("price")}
              >
                Selling Price {sortKey === "price" && "↑"}
              </th>
              <th
                className="cursor-pointer px-6 py-4 font-semibold tracking-wider transition-colors hover:bg-gray-100"
                onClick={() => setSortKey("price")}
              >
                Cost Price {sortKey === "price" && "↑"}
              </th>
              <th
                className="cursor-pointer px-6 py-4 font-semibold tracking-wider transition-colors hover:bg-gray-100"
                onClick={() => setSortKey("price")}
              >
                Profit {sortKey === "price" && "↑"}
              </th>

              <th
                className="cursor-pointer px-6 py-4 text-center font-semibold tracking-wider transition-colors hover:bg-gray-100"
                onClick={() => setSortKey("stock")}
              >
                Stock Level {sortKey === "stock" && "↑"}
              </th>
              {isAdmin && (
                <th className="px-6 py-4 text-center font-semibold tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <LoaderCircle className="mb-4 animate-spin opacity-20" size={48} />
                    <p className="text-lg">Loading inventory...</p>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <Package size={48} className="mb-4 opacity-20" />
                    <p className="text-lg">No items found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="bg-white transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 align-middle">
                    <div className="text-sm font-medium text-gray-900">
                      {getVendorName(product.vendorId)}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500 opacity-70">
                      ID: {product.vendorId}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="text-sm text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="text-sm font-medium text-gray-900">
                      ₦{product.sellingPrice.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="text-sm font-medium text-gray-900">
                      ₦{product.costPrice.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="text-sm font-medium text-gray-900">
                      ₦{(product.sellingPrice - product.costPrice).toFixed(2)}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center align-middle">
                    <span
                      className={`text-sm font-bold px-2 py-1 rounded ${
                        product.stock < 10 ? "bg-red-100 text-red-600" : "text-gray-900"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-center align-middle">
                      <button
                        type="button"
                        onClick={() =>
                          handleEditClick({
                            ...product,
                            lastSupplyDate: String(product.lastSupplyDate ?? new Date().toISOString()),
                            lowStockThreshold: Number(product.lowStockThreshold ?? 0),
                          })
                        }
                        className="rounded-lg p-2 text-pink-600 transition-colors hover:bg-pink-50"
                        title="Edit Product Details"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
        <span>Showing {products.length} items</span>
        <span>
          Sorted by:{" "}
          {sortKey === "stock"
            ? "Stock Level (Asc)"
            : sortKey === "name"
            ? "Name"
            : sortKey === "price"
            ? "Price"
            : "Vendor"}
        </span>
      </div>
    </div>
  );
};
