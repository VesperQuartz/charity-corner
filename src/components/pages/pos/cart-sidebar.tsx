import { Minus, Plus, Trash2 } from "lucide-react";
import React from "react";
import { CartItem } from "@/types";
import { QuantityInput } from "./quantity-input";

interface CartSidebarProps {
  cart: CartItem[];
  clearCart: () => void;
  updateQuantity: (productId: string, delta: number) => void;
  setItemQuantityExact: (productId: string, qty: number) => void;
  initiateRemoveItem: (item: CartItem) => void;
  subtotal: number;
  total: number;
  handleCheckout: () => void;
}

export const CartSidebar = ({
  cart,
  clearCart,
  updateQuantity,
  setItemQuantityExact,
  initiateRemoveItem,
  subtotal,
  total,
  handleCheckout,
}: CartSidebarProps) => {
  return (
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
  );
};
