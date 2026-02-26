import { CheckCircle, Download, Printer } from "lucide-react";
import React from "react";
import { PaymentMethod, Transaction } from "@/types";
import { PrintableReceipt } from "./printable-receipt";

interface SuccessViewProps {
  lastTransaction: Transaction;
  handlePrint: () => void;
  handleDownloadReceipt: () => void;
  setLastTransaction: (transaction: Transaction | null) => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export const SuccessView = ({
  lastTransaction,
  handlePrint,
  handleDownloadReceipt,
  setLastTransaction,
  contentRef,
}: SuccessViewProps) => {
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
        <div className="space-y-1 border-t pt-4 pb-4">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₦{lastTransaction.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>
              {lastTransaction.paymentMethod === "CREDIT"
                ? "Bought via Credit"
                : `Paid via ${lastTransaction.paymentMethod}`}
            </span>
          </div>
        </div>
        <div className="space-y-1 border-t pt-4">
          {lastTransaction.debtorName ? (
            <div className="flex flex-col justify-between font-bold">
              <span>Name</span>
              <span className="text-gray-500">
                {lastTransaction.debtorName}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          type={"button"}
          onClick={() => handlePrint()}
          className="flex items-center gap-2 rounded-lg bg-pink-600 px-6 py-2 font-medium text-white shadow-sm transition-colors hover:bg-pink-700"
        >
          <Printer size={18} /> Print Receipt
        </button>
        <button
          type={"button"}
          onClick={handleDownloadReceipt}
          className="flex items-center gap-2 rounded-lg bg-gray-200 px-6 py-2 font-medium transition-colors hover:bg-gray-300"
        >
          <Download size={18} /> Download PDF
        </button>
        <button
          type="button"
          onClick={() => setLastTransaction(null)}
          className="rounded-lg border-2 border-pink-600 bg-transparent px-6 py-2 font-medium text-pink-600 transition-colors hover:bg-pink-50"
        >
          New Sale
        </button>
      </div>

      {/* Hidden receipt for thermal printing */}
      <PrintableReceipt ref={contentRef} transaction={lastTransaction} />
    </div>
  );
};
