"use client";

import { useForm } from "@tanstack/react-form";
import { LoaderCircle, Users, X } from "lucide-react";
import React, { useTransition } from "react";
import { Activity } from "react";
import { z } from "zod";
import { FormError } from "@/components/error-form";
import type { Vendor } from "@/types";

const vendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required").trim(),
  contact: z.string().min(1, "Contact is required").trim(),
  email: z.string().email("Must be a valid email address").trim(),
});

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: z.infer<typeof vendorFormSchema>) => Promise<void>;
  editingVendor: Vendor | null;
  isPending: boolean;
}

const VendorModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingVendor,
  isPending,
}: VendorModalProps) => {
  const form = useForm({
    defaultValues: {
      name: editingVendor?.name || "",
      contact: editingVendor?.contact || "",
      email: editingVendor?.email || "",
    },
    validators: {
      onSubmit: vendorFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  // Reset form when editingVendor changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: editingVendor?.name || "",
        contact: editingVendor?.contact || "",
        email: editingVendor?.email || "",
      });
    }
  }, [editingVendor, isOpen, form]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md animate-in overflow-y-auto rounded-xl bg-white shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b bg-gray-50 p-6">
          <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Users className="text-pink-600" />{" "}
            {editingVendor ? "Edit Vendor Details" : "Add New Vendor"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 p-6"
        >
          <form.Field name="name">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Vendor Name
                </label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full rounded-md border p-2 outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g. Global Supplies Ltd"
                />
                <FormError field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="contact">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full rounded-md border p-2 outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g. +234 800..."
                />
                <FormError field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="email">
            {(field) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full rounded-md border p-2 outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g. contact@vendor.com"
                />
                <FormError field={field} />
              </div>
            )}
          </form.Field>
          <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 py-2 font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => {
                return (
                  <button
                    disabled={!canSubmit || isSubmitting || isPending}
                    type="submit"
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 py-2 font-medium text-white shadow-sm hover:bg-pink-700"
                  >
                    {editingVendor ? "Update Vendor" : "Save Vendor"}
                    <Activity mode={isPending ? "visible" : "hidden"}>
                      <LoaderCircle className="animate-spin" size={18} />
                    </Activity>
                  </button>
                );
              }}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorModal;
