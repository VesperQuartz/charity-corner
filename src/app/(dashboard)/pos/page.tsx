/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import {
  AlertTriangle,
  Banknote,
  CheckCircle,
  CreditCard,
  Download,
  Minus,
  Plus,
  Receipt,
  Search,
  Smartphone,
  Trash2,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import z from "zod";
import { FormError } from "@/components/error-form";
import { useAuth } from "@/context/AuthContext";
import { orpc } from "@/lib/orpc";
import { InsertProduct } from "@/repo/schema";
import { CartItem, PaymentMethod, Transaction } from "@/types";

const paymentFormSchema = z
  .object({
    paymentMethod: z.nativeEnum(PaymentMethod),
    amountTendered: z.string(),
    debtorName: z.string(),
  })
  .refine(
    (data) =>
      data.paymentMethod !== PaymentMethod.CREDIT ||
      data.debtorName.trim().length > 0,
    {
      message: "Debtor name is required for store credit.",
      path: ["debtorName"],
    },
  );

// Helper component to handle quantity input state
// Allows the field to be empty while typing without breaking the number type in parent
const QuantityInput = ({
  quantity,
  onUpdate,
}: {
  quantity: number;
  onUpdate: (newQty: number) => void;
}) => {
  const [val, setVal] = useState(quantity.toString());

  // Sync with prop if it changes externally (e.g. +/- buttons)
  useEffect(() => {
    setVal(quantity.toString());
  }, [quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setVal(newVal);

    // If it's a valid number, update parent immediately
    if (newVal !== "") {
      const parsed = parseInt(newVal);
      if (!isNaN(parsed) && parsed >= 1) {
        onUpdate(parsed);
      }
    }
  };

  const handleBlur = () => {
    // If empty or invalid on blur, reset to current prop value
    if (val === "" || isNaN(parseInt(val)) || parseInt(val) < 1) {
      setVal(quantity.toString());
    } else {
      // Format correctly (e.g. remove leading zeros)
      setVal(parseInt(val).toString());
    }
  };

  return (
    <input
      type="number"
      min="1"
      className="mx-1 w-12 rounded border border-gray-200 py-1 text-center font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none"
      value={val}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};

type CreateTransactionResult = {
  id: string;
  date: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    priceAtSale: number;
  }[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  cashierId: string;
  debtorName?: string;
};

type CreateTransactionVars = {
  items: {
    productId: string;
    name: string;
    quantity: number;
    priceAtSale: number;
  }[];
  subtotal: number;
  total: number;
  paymentMethod: "CASH" | "TRANSFER" | "POS" | "CREDIT";
  debtorName?: string | null;
};

interface CreateTransactionMutation {
  mutate: (
    variables: CreateTransactionVars,
    options?: {
      onSuccess?: (data: CreateTransactionResult) => void;
      onError?: (error: Error) => void;
    },
  ) => void;
  isPending: boolean;
}

// Payment modal with its own form so defaultValues (e.g. amountTendered = total) are correct when opened
const PaymentModalForm = ({
  total,
  cart,
  onSuccess,
  onCancel,
  createTransactionMutation,
}: {
  total: number;
  cart: CartItem[];
  onSuccess: (data: CreateTransactionResult) => void;
  onCancel: () => void;
  createTransactionMutation: CreateTransactionMutation;
}) => {
  const paymentForm = useForm({
    defaultValues: {
      paymentMethod: PaymentMethod.CASH,
      amountTendered: total.toString(),
      debtorName: "",
    },
    validators: {
      onSubmit: paymentFormSchema,
    },
    onSubmit: ({ value }) => {
      createTransactionMutation.mutate(
        {
          items: cart.map((c) => ({
            productId: String(c.id),
            name: c.name,
            quantity: c.quantity,
            priceAtSale: c.sellingPrice,
          })),
          subtotal: cart.reduce((s, i) => s + i.sellingPrice * i.quantity, 0),
          total,
          paymentMethod: value.paymentMethod,
          debtorName:
            value.paymentMethod === PaymentMethod.CREDIT
              ? value.debtorName
              : undefined,
        },
        {
          onSuccess: (data) => {
            onSuccess(data);
            paymentForm.reset();
          },
          onError: (error) => {
            alert(
              error instanceof Error
                ? error.message
                : "Failed to process transaction",
            );
          },
        },
      );
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="bg-pink-600 p-6 text-white">
          <h2 className="mb-1 text-2xl font-bold">
            Total: ₦{total.toFixed(2)}
          </h2>
          <p className="opacity-90">
            Select payment method to complete transaction
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            paymentForm.handleSubmit();
          }}
          className="space-y-6 p-6"
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: PaymentMethod.CASH, icon: Banknote, label: "Cash" },
              { id: PaymentMethod.POS, icon: CreditCard, label: "Card / POS" },
              {
                id: PaymentMethod.TRANSFER,
                icon: Smartphone,
                label: "Transfer",
              },
              {
                id: PaymentMethod.CREDIT,
                icon: Receipt,
                label: "Store Credit",
              },
            ].map((method) => (
              <paymentForm.Field key={method.id} name="paymentMethod">
                {(field) => (
                  <button
                    type="button"
                    onClick={() => field.setValue(method.id)}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${field.state.value === method.id ? "border-pink-600 bg-pink-50 text-pink-700" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <method.icon size={24} className="mb-2" />
                    <span className="font-medium">{method.label}</span>
                  </button>
                )}
              </paymentForm.Field>
            ))}
          </div>

          <paymentForm.Field name="paymentMethod">
            {(paymentMethodField) =>
              paymentMethodField.state.value === PaymentMethod.CASH ? (
                <paymentForm.Field name="amountTendered">
                  {(field) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Amount Tendered
                      </label>
                      <div className="relative">
                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                          ₦
                        </span>
                        <input
                          type="number"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-8 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-100 p-3">
                        <span className="font-medium text-gray-600">
                          Change Due:
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          ₦
                          {Math.max(
                            0,
                            (parseFloat(field.state.value) || 0) - total,
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </paymentForm.Field>
              ) : null
            }
          </paymentForm.Field>

          <paymentForm.Field name="paymentMethod">
            {(paymentMethodField) =>
              paymentMethodField.state.value === PaymentMethod.CREDIT ? (
                <paymentForm.Field name="debtorName">
                  {(field) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Debtor Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      />
                      <FormError field={field} />
                    </div>
                  )}
                </paymentForm.Field>
              ) : null
            }
          </paymentForm.Field>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg py-3 font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTransactionMutation.isPending}
              className="flex-1 rounded-lg bg-pink-600 py-3 font-bold text-white shadow-md hover:bg-pink-700 disabled:opacity-50"
            >
              {createTransactionMutation.isPending
                ? "Processing..."
                : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const POS = () => {
  const queryClient = useQueryClient();
  const products = useQuery(orpc.getProducts.queryOptions());
  const createTransactionMutation = useMutation(
    orpc.createTransaction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(
    null,
  );
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);

  const searchForm = useForm({
    defaultValues: { searchTerm: "" },
  });

  const filteredProducts = useMemo(() => {
    const term = searchForm.state.values.searchTerm ?? "";
    return products.data?.filter((p) =>
      p.name.toLowerCase().includes(term.toLowerCase()),
    );
  }, [products, searchForm.state.values.searchTerm]);

  const addToCart = (product: InsertProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const setItemQuantityExact = (productId: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: qty } : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const initiateRemoveItem = (item: CartItem) => {
    setItemToDelete(item);
  };

  const confirmRemoveItem = () => {
    if (itemToDelete) {
      removeFromCart(String(itemToDelete.id));
      setItemToDelete(null);
    }
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0,
  );
  const tax = 0; // Keeping simple as requested
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (data: {
    id: string;
    date: string;
    items: {
      productId: string;
      name: string;
      quantity: number;
      priceAtSale: number;
    }[];
    subtotal: number;
    total: number;
    paymentMethod: string;
    cashierId: string;
    debtorName?: string;
  }) => {
    setLastTransaction({
      id: data.id,
      date: data.date,
      items: data.items,
      subtotal: data.subtotal,
      total: data.total,
      paymentMethod: data.paymentMethod as PaymentMethod,
      cashierId: data.cashierId,
      debtorName: data.debtorName,
    });
    setCart([]);
    setShowPaymentModal(false);
  };

  const handleDownloadReceipt = () => {
    if (!lastTransaction) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 150], // 80mm width (standard thermal receipt), dynamic height would be better but fixed is okay for now
    });

    // Header
    doc.setFontSize(16);
    doc.text("Charity Corner", 40, 10, { align: "center" });

    doc.setFontSize(10);
    doc.text("Sales Receipt", 40, 16, { align: "center" });

    doc.setFontSize(8);
    doc.text(`Transaction #${lastTransaction.id}`, 40, 22, { align: "center" });
    doc.text(new Date(lastTransaction.date).toLocaleString(), 40, 26, {
      align: "center",
    });

    // Divider
    doc.line(5, 30, 75, 30);

    // Items
    let y = 36;
    doc.setFontSize(9);

    lastTransaction.items.forEach((item) => {
      // Item Name
      doc.text(item.name, 5, y);
      y += 4;

      // Qty x Price = Total
      const lineTotal = item.priceAtSale * item.quantity;
      doc.text(`${item.quantity} x N${item.priceAtSale.toFixed(2)}`, 5, y, {
        align: "left",
      });
      doc.text(`N${lineTotal.toFixed(2)}`, 75, y, { align: "right" });
      y += 6;
    });

    // Divider
    doc.line(5, y, 75, y);
    y += 6;

    // Totals
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 5, y);
    doc.text(`N${lastTransaction.total.toFixed(2)}`, 75, y, { align: "right" });

    y += 8;

    // Payment Method
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const paymentText =
      lastTransaction.paymentMethod === PaymentMethod.CREDIT
        ? "Bought via Credit"
        : `Paid via ${lastTransaction.paymentMethod}`;

    doc.text(paymentText, 40, y, { align: "center" });

    if (lastTransaction.debtorName) {
      y += 4;
      doc.text(`Debtor: ${lastTransaction.debtorName}`, 40, y, {
        align: "center",
      });
    }

    y += 8;
    doc.text("Thank you for your patronage!", 40, y, { align: "center" });

    doc.save(`receipt_${lastTransaction.id}.pdf`);
  };

  if (lastTransaction) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-6 rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-4 text-green-500">
          <CheckCircle size={64} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          Transaction Successful!
        </h2>
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-gray-50 p-6 font-mono text-sm">
          <div className="mb-4 border-b pb-4 text-center">
            <h3 className="text-lg font-bold">Charity Corner</h3>
            <p>Transaction #{lastTransaction.id}</p>
            <p>{new Date(lastTransaction.date).toLocaleString()}</p>
          </div>
          <div className="mb-4 space-y-2">
            {lastTransaction.items.map((item, idx) => (
              <div key={crypto.randomUUID()} className="flex justify-between">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>₦{(item.priceAtSale * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 border-t pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₦{lastTransaction.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>
                {lastTransaction.paymentMethod === PaymentMethod.CREDIT
                  ? "Bought via Credit"
                  : `Paid via ${lastTransaction.paymentMethod}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type={"button"}
            onClick={handleDownloadReceipt}
            className="flex items-center gap-2 rounded-lg bg-gray-200 px-6 py-2 font-medium transition-colors hover:bg-gray-300"
          >
            <Download size={18} /> Download Receipt
          </button>
          <button
            type="button"
            onClick={() => setLastTransaction(null)}
            className="rounded-lg bg-pink-600 px-6 py-2 font-medium text-white transition-colors hover:bg-pink-700"
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Product Grid */}
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

        <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts?.map((product) => (
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
      </div>

      {/* Cart Sidebar */}
      <div className="flex h-full w-96 flex-col rounded-lg border-l border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
          <button
            type="button"
            onClick={clearCart}
            className="text-sm font-medium text-red-500 hover:text-red-700"
          >
            Clear All
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <span className="mb-2 text-4xl">🛒</span>
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    ₦{item.sellingPrice.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(String(item.id), -1)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  >
                    <Minus size={16} />
                  </button>
                  <QuantityInput
                    quantity={item.quantity}
                    onUpdate={(newQty) =>
                      setItemQuantityExact(String(item.id), newQty)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => updateQuantity(String(item.id), 1)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => initiateRemoveItem(item)}
                    className="ml-1 rounded p-1 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₦{subtotal.toFixed(2)}</span>
          </div>
          <div className="mb-4 flex justify-between text-2xl font-bold text-gray-900">
            <span>Total</span>
            <span>₦{total.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full rounded-lg bg-pink-600 py-3 text-lg font-bold text-white shadow-lg transition-all hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModalForm
          total={total}
          cart={cart}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
          createTransactionMutation={createTransactionMutation}
        />
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm animate-in overflow-hidden rounded-xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Remove Item?
              </h3>
              <p className="mb-6 text-gray-500">
                Are you sure you want to remove{" "}
                <span className="font-bold text-gray-800">
                  {itemToDelete.name}
                </span>{" "}
                from the cart?
              </p>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveItem}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
