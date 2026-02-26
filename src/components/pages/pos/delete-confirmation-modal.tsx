import { AlertTriangle } from "lucide-react";
import React from "react";
import { CartItem } from "@/types";

interface DeleteConfirmationModalProps {
  itemToDelete: CartItem;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal = ({
  itemToDelete,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) => {
  return (
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
              onClick={onCancel}
              className="flex-1 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-red-600 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
