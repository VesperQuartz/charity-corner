"use client";

import { useForm } from "@tanstack/react-form";
import { CheckCircle, LoaderCircle, Package, X } from "lucide-react";
import React, { useMemo } from "react";
import { Activity } from "react";
import { z } from "zod";
import { FormError } from "@/components/error-form";
import type { Product, Vendor } from "@/types";

const supplyFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  vendorName: z.string().min(1, "Vendor name is required").trim(),
  vendorId: z.string(),
  itemName: z.string().min(1, "Item name is required").trim(),
  productId: z.string(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  costPrice: z.number().min(0, "Cost price must be 0 or more"),
  sellingPrice: z.number().min(0, "Selling price must be 0 or more"),
  profit: z.number(),
  purchaseOrder: z.string(),
  lowStockThreshold: z.number().int().min(0),
});

interface SupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: z.infer<typeof supplyFormSchema>) => Promise<void>;
  editingSupplyId: string | null;
  initialValues: z.infer<typeof supplyFormSchema>;
  isPending: boolean;
  vendors: Vendor[];
  products: Product[];
}

const SupplyModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingSupplyId,
  initialValues,
  isPending,
  vendors,
  products,
}: SupplyModalProps) => {
  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: supplyFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  // Reset form when initialValues change or modal opens
  React.useEffect(() => {
    if (isOpen) {
      form.reset(initialValues);
    }
  }, [initialValues, isOpen, form]);

  const handleCostChange = (cost: number) => {
    const current = form.state.values;
    const profit = current.sellingPrice - cost;
    form.setFieldValue("costPrice", cost);
    form.setFieldValue("profit", parseFloat(profit.toFixed(2)));
  };

  const handleProfitChange = (profit: number) => {
    const current = form.state.values;
    const selling = current.costPrice + profit;
    form.setFieldValue("profit", profit);
    form.setFieldValue("sellingPrice", parseFloat(selling.toFixed(2)));
  };

  const handleSellingChange = (selling: number) => {
    const current = form.state.values;
    const profit = selling - current.costPrice;
    form.setFieldValue("sellingPrice", selling);
    form.setFieldValue("profit", parseFloat(profit.toFixed(2)));
  };

  const selectExistingProduct = (p: Product) => {
    const profit = p.sellingPrice - p.costPrice;
    form.setFieldValue("productId", p.id);
    form.setFieldValue("itemName", p.name);
    form.setFieldValue("costPrice", p.costPrice);
    form.setFieldValue("sellingPrice", p.sellingPrice);
    form.setFieldValue("profit", parseFloat(profit.toFixed(2)));
    form.setFieldValue("lowStockThreshold", p.lowStockThreshold ?? 10);
  };

  const selectExistingVendor = (v: Vendor) => {
    form.setFieldValue("vendorId", v.id);
    form.setFieldValue("vendorName", v.name);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl animate-in overflow-y-auto rounded-xl bg-white shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b bg-gray-50 p-6">
          <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Package className="text-pink-600" />{" "}
            {editingSupplyId ? "Edit Supply Record" : "Record New Supply"}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6 p-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="date">
              {(field) => (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full rounded-md border p-2"
                  />
                  <FormError field={field} />
                </div>
              )}
            </form.Field>
            <form.Field name="purchaseOrder">
              {(field) => (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Purchase Order</label>
                  <input
                    type="text"
                    readOnly
                    value={field.state.value}
                    className="w-full cursor-not-allowed rounded-md border bg-gray-100 p-2 text-gray-500"
                  />
                </div>
              )}
            </form.Field>
          </div>

          <div>
            <form.Field name="vendorName">
              {(field) => (
                <>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Vendor Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="off"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        form.setFieldValue("vendorId", "");
                      }}
                      className="w-full rounded-md border p-2"
                      placeholder="Enter vendor name..."
                    />
                    <form.Subscribe selector={(state) => [state.values.vendorName, state.values.vendorId]}>
                      {([vendorName, vendorId]) => {
                        const matches =
                          !vendorName || vendorId
                            ? []
                            : vendors.filter((v) =>
                                v.name.toLowerCase().includes(vendorName.toLowerCase())
                              );

                        if (matches.length === 0) return null;

                        return (
                          <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                            {matches.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => selectExistingVendor(v)}
                                className="group flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-100"
                              >
                                <span className="font-medium text-gray-800">{v.name}</span>
                                <span className="text-xs text-gray-400 group-hover:text-pink-500">
                                  Use Existing
                                </span>
                              </button>
                            ))}
                          </div>
                        );
                      }}
                    </form.Subscribe>
                  </div>
                  <FormError field={field} />
                </>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.values.vendorId}>
              {(vendorId) =>
                vendorId ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle size={12} /> Linked to existing vendor database
                  </p>
                ) : null
              }
            </form.Subscribe>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-4">
            <form.Field name="itemName">
              {(field) => (
                <div className="relative">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Item Supplied</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Search existing or enter new product name..."
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      form.setFieldValue("productId", "");
                    }}
                    className="w-full rounded-md border p-2"
                  />
                  <form.Subscribe selector={(state) => [state.values.itemName, state.values.productId]}>
                    {([itemName, productId]) => {
                      const matches =
                        editingSupplyId || !itemName || productId
                          ? []
                          : products.filter((p) =>
                              p.name.toLowerCase().includes(itemName.toLowerCase())
                            );

                      if (matches.length === 0) return null;

                      return (
                        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                          {matches.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectExistingProduct(p)}
                              className="group flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-100"
                            >
                              <span className="font-medium text-gray-800">{p.name}</span>
                              <span className="text-xs text-gray-400 group-hover:text-pink-500">
                                Use Existing
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    }}
                  </form.Subscribe>
                  <FormError field={field} />
                </div>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.values.productId}>
              {(productId) =>
                productId ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle size={12} /> Linked to existing product database
                  </p>
                ) : null
              }
            </form.Subscribe>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="quantity">
                  {(field) => (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                        className="w-full rounded-md border p-2 text-lg font-bold"
                      />
                      <FormError field={field} />
                    </div>
                  )}
                </form.Field>
                <form.Field name="lowStockThreshold">
                  {(field) => (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Low Stock Alert Level
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                        className="w-full rounded-md border p-2 text-gray-600"
                        placeholder="Default: 10"
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            </div>

            <div className="grid grid-cols-3 items-end gap-4">
              <form.Field name="costPrice">
                {(field) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Cost Price (₦)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={field.state.value}
                      onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-md border p-2"
                    />
                    <FormError field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="profit">
                {(field) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Profit (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onChange={(e) => handleProfitChange(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-md border p-2 font-medium text-green-600"
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="sellingPrice">
                {(field) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Selling Price (₦)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={field.state.value}
                      onChange={(e) => handleSellingChange(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-md border p-2 font-bold"
                    />
                    <FormError field={field} />
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <button
                  disabled={!canSubmit || isSubmitting || isPending}
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 py-3 font-bold text-white shadow-md hover:bg-pink-700"
                >
                  {editingSupplyId ? "Update Record" : "Confirm Supply Entry"}
                  <Activity mode={isPending ? "visible" : "hidden"}>
                    <LoaderCircle className="animate-spin" size={18} />
                  </Activity>
                </button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplyModal;
