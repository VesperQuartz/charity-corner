"use client";

import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Layers, Upload, X, AlertTriangle } from "lucide-react";
import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import type { Vendor } from "@/types";

interface BulkVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (vendors: any[]) => Promise<void>;
  existingVendors: Vendor[];
}

const BulkVendorModal = ({
  isOpen,
  onClose,
  onUpload,
  existingVendors,
}: BulkVendorModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadTemplate = () => {
    const headers = [["Vendor Name", "Contact Phone", "Email Address"]];
    const example = [
      ["Global Supplies Ltd", "+234 800 000 0000", "contact@globalsupplies.com"],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Vendor_Upload_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length < 2) {
          setError("File appears to be empty or missing headers.");
          setPreview([]);
          return;
        }

        const rows = data
          .slice(1)
          .map((row, idx) => {
            return {
              tempId: idx,
              name: row[0],
              contact: row[1] || "",
              email: row[2] || "",
              isValid: !!row[0],
            };
          })
          .filter((r) => r.name);

        setPreview(rows);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to parse file. Please ensure it is a valid Excel or CSV file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcess = async () => {
    if (preview.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      await onUpload(preview);
      setPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onClose();
    } catch (e) {
      setError("Error processing records. Please try again.");
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl animate-in flex-col rounded-xl bg-white shadow-2xl duration-200 zoom-in">
        <div className="flex shrink-0 items-center justify-between border-b bg-gray-50 p-6">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <Layers className="text-pink-600" /> Bulk Vendor Import
            </h3>
            <p className="text-sm text-gray-500">
              Upload Excel or CSV file to import multiple vendors.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden p-6">
          <div className="group relative mb-6 flex shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-pink-300 hover:bg-pink-50">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm transition-transform group-hover:scale-110">
              <Upload size={32} />
            </div>
            <h4 className="mb-1 text-lg font-bold text-gray-800">Click to Upload or Drag File Here</h4>
            <p className="mb-4 text-sm text-gray-500">Supports .xlsx, .xls, .csv</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                downloadTemplate();
              }}
              className="relative z-10 flex items-center gap-2 text-sm font-medium text-pink-600 hover:underline"
            >
              <Download size={14} /> Download Template File
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {preview.length > 0 && (
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-3">
                <h4 className="flex items-center gap-2 font-bold text-gray-700">
                  <FileSpreadsheet size={16} /> Data Preview
                </h4>
                <span className="text-xs text-gray-500">{preview.length} rows found</span>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Vendor Name</th>
                      <th className="px-4 py-2">Contact Phone</th>
                      <th className="px-4 py-2">Email Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((row) => (
                      <tr
                        key={crypto.randomUUID()}
                        className={row.isValid ? "hover:bg-gray-50" : "bg-red-50 hover:bg-red-100"}
                      >
                        <td className="px-4 py-2">
                          {row.isValid ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                              <CheckCircle size={12} /> Valid
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                              <AlertTriangle size={12} /> Invalid
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {row.name || <span className="text-red-400 italic">Missing</span>}
                        </td>
                        <td className="px-4 py-2">{row.contact}</td>
                        <td className="px-4 py-2">{row.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-4 border-t bg-gray-50 p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <div className="flex flex-1 items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleProcess}
              disabled={preview.filter((r) => r.isValid).length === 0 || isProcessing}
              className="flex items-center gap-2 rounded-lg bg-pink-600 px-8 py-3 font-bold text-white shadow-lg hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isProcessing ? "Processing..." : `Import ${preview.filter((r) => r.isValid).length} Vendors`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkVendorModal;
