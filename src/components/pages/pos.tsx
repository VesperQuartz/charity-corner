"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { useReactToPrint } from "react-to-print";
import React, { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { orpc } from "@/lib/orpc";
import { InsertProduct } from "@/repo/schema";
import { CartItem, PaymentMethod, Transaction } from "@/types";
import { CartSidebar } from "./pos/cart-sidebar";
import { DeleteConfirmationModal } from "./pos/delete-confirmation-modal";
import { CreateTransactionResult, PaymentModalForm } from "./pos/payment-modal-form";
import { ProductGrid } from "./pos/product-grid";
import { SuccessView } from "./pos/success-view";

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

  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef,
  });

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

  const handlePaymentSuccess = (data: CreateTransactionResult) => {
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
      format: [80, 150],
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
      lastTransaction.paymentMethod === "CREDIT"
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
      <SuccessView
        lastTransaction={lastTransaction}
        handlePrint={handlePrint}
        handleDownloadReceipt={handleDownloadReceipt}
        setLastTransaction={setLastTransaction}
        contentRef={contentRef}
      />
    );
  }

  return (
    <div className="flex h-full gap-4">
      <ProductGrid 
        products={products.data as InsertProduct[]} 
        addToCart={addToCart} 
      />

      <CartSidebar
        cart={cart}
        clearCart={clearCart}
        updateQuantity={updateQuantity}
        setItemQuantityExact={setItemQuantityExact}
        initiateRemoveItem={initiateRemoveItem}
        subtotal={subtotal}
        total={total}
        handleCheckout={handleCheckout}
      />

      {showPaymentModal && (
        <PaymentModalForm
          total={total}
          cart={cart}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
          createTransactionMutation={createTransactionMutation}
        />
      )}

      {itemToDelete && (
        <DeleteConfirmationModal
          itemToDelete={itemToDelete}
          onCancel={() => setItemToDelete(null)}
          onConfirm={confirmRemoveItem}
        />
      )}
    </div>
  );
};

export default POS;
