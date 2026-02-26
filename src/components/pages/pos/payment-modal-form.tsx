import { useForm } from "@tanstack/react-form";
import { Banknote, CreditCard, Receipt, Smartphone } from "lucide-react";
import z from "zod";
import { FormError } from "@/components/error-form";
import { paymentMethodValues } from "@/repo/schema";
import { CartItem, PaymentMethod } from "@/types";

const paymentFormSchema = z
  .object({
    paymentMethod: z.enum(paymentMethodValues),
    amountTendered: z.string(),
    debtorName: z.string(),
  })
  .refine(
    (data) =>
      data.paymentMethod !== "CREDIT" || data.debtorName.trim().length > 0,
    {
      message: "Debtor name is required for store credit.",
      path: ["debtorName"],
    },
  );

export type CreateTransactionResult = {
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

export const PaymentModalForm = ({
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
      paymentMethod: "CASH" as PaymentMethod,
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
          paymentMethod: value.paymentMethod as PaymentMethod,
          debtorName:
            value.paymentMethod === "CREDIT" ? value.debtorName : undefined,
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
              { id: "CASH", icon: Banknote, label: "Cash" },
              { id: "POS", icon: CreditCard, label: "Card / POS" },
              {
                id: "TRANSFER",
                icon: Smartphone,
                label: "Transfer",
              },
              {
                id: "CREDIT",
                icon: Receipt,
                label: "Store Credit",
              },
            ].map((method) => (
              <paymentForm.Field key={method.id} name="paymentMethod">
                {(field) => (
                  <button
                    type="button"
                    onClick={() => field.setValue(method.id as PaymentMethod)}
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
              paymentMethodField.state.value === "CASH" ? (
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
              paymentMethodField.state.value === "CREDIT" ? (
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
