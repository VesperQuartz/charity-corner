"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";
import React from "react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName?: string;
  description?: string;
  confirmText?: string;
  isPending?: boolean;
  warningText?: string;
}

const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  description,
  confirmText = "Delete",
  isPending = false,
  warningText,
}: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm animate-in overflow-hidden rounded-xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle size={24} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
          <p className="mb-6 text-gray-500">
            {description || "Are you sure you want to delete"}{" "}
            {itemName && <span className="font-bold text-gray-800">({itemName})</span>}
            ? <br />
            {warningText && (
              <span className="text-sm font-medium text-red-500">
                {warningText}
              </span>
            )}
          </p>
          <div className="flex w-full gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:bg-red-400"
            >
              {isPending ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} />
                  Deleting...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
