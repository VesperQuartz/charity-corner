import { CheckCircle, LoaderCircle, Activity } from "lucide-react";
import React from "react";
import { Transaction } from "@/types";

interface PaymentConfirmationModalProps {
  selectedTxn: Transaction;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const PaymentConfirmationModal = ({
  selectedTxn,
  isPending,
  onCancel,
  onConfirm,
}: PaymentConfirmationModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm animate-in overflow-hidden rounded-xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle size={24} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            Confirm Payment
          </h3>
          <p className="mb-6 text-gray-500">
            Has{" "}
            <span className="font-bold text-gray-800">
              {selectedTxn.debtorName}
            </span>{" "}
            paid their debt of{" "}
            <span className="font-bold text-green-600">
              ₦{selectedTxn.total.toFixed(2)}
            </span>
            ?
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
              disabled={isPending}
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              Confirm Paid
              {isPending && <LoaderCircle className="animate-spin" size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
