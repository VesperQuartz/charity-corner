import { AlertTriangle, Edit2, LoaderCircle, Save, X } from "lucide-react";
import React from "react";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editForm: { name: string; sellingPrice: number; costPrice: number };
  setEditForm: (form: { name: string; sellingPrice: number; costPrice: number }) => void;
  onSave: () => void;
  isPending: boolean;
}

export const EditProductModal = ({
  isOpen,
  onClose,
  editForm,
  setEditForm,
  onSave,
  isPending,
}: EditProductModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md animate-in overflow-hidden rounded-xl bg-white shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-6">
          <h3 className="flex items-center gap-2 font-bold text-gray-800">
            <Edit2 size={18} className="text-pink-600" /> Edit Product
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cost Price (₦)
              </label>
              <input
                type="number"
                value={editForm.costPrice}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    costPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Selling Price (₦)
              </label>
              <input
                type="number"
                value={editForm.sellingPrice}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    sellingPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-gray-300 p-2.5 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="flex gap-2 rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
            <AlertTriangle size={16} className="shrink-0" />
            <p>
              Stock quantity cannot be edited directly. To adjust stock,
              please use the Vendor Supply interface.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={onSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-pink-700"
            >
              <Save size={18} /> Save Changes
              {isPending && <LoaderCircle className="animate-spin" size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
