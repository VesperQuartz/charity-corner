import { useForm } from "@tanstack/react-form";
import { Search } from "lucide-react";
import React from "react";
import { InsertProduct } from "@/repo/schema";

interface ProductGridProps {
  products: InsertProduct[];
  addToCart: (product: InsertProduct) => void;
}

export const ProductGrid = ({ products, addToCart }: ProductGridProps) => {
  const searchForm = useForm({
    defaultValues: { searchTerm: "" },
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <searchForm.Field name="searchTerm">
          {(field) => (
            <div className="relative">
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </searchForm.Field>
      </div>

      <searchForm.Subscribe selector={(state) => state.values.searchTerm}>
        {(searchTerm) => {
          const term = searchTerm ?? "";
          const filteredProducts =
            products?.filter((p) =>
              p.name.toLowerCase().includes(term.toLowerCase()),
            ) ?? [];

          return (
            <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="group flex flex-col rounded-lg border border-transparent bg-white p-4 text-left shadow-sm transition-shadow hover:border-pink-500 hover:shadow-md"
                >
                  <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-gray-800 group-hover:text-pink-600">
                    {product.name}
                  </h3>
                  <div className="mt-auto flex w-full items-center justify-between pt-4">
                    <span className="text-lg font-bold text-gray-900">
                      ₦{product.sellingPrice.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          );
        }}
      </searchForm.Subscribe>
    </div>
  );
};
