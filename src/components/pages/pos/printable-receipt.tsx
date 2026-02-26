import React from "react";
import { Transaction } from "@/types";

// Hidden printable receipt component optimized for 80mm thermal printers
export const PrintableReceipt = React.forwardRef<HTMLDivElement, { transaction: Transaction }>(
  ({ transaction }, ref) => {
    return (
      <div style={{ display: "none" }}>
        <div 
          ref={ref} 
          className="p-4 font-mono text-black bg-white"
          style={{ 
            width: '80mm',
            padding: '4mm',
            color: 'black',
            backgroundColor: 'white'
          }}
        >
          <style>{`
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; padding: 0; width: 80mm; }
            }
          `}</style>
          
          <div className="flex flex-col items-center mb-4 text-center">
            <img src="/logo-new.png" alt="Logo" className="w-20 h-auto mb-2" />
            <h1 className="text-lg font-bold uppercase">Charity Corner</h1>
            <p className="text-[10px]">Quality Goods at Affordable Prices</p>
          </div>
          
          <div className="border-t border-dashed border-black my-2"></div>
          
          <div className="text-[10px] mb-4 space-y-0.5">
            <p className="font-bold">RECEIPT</p>
            <p>ID: {transaction.id.toUpperCase()}</p>
            <p>Date: {new Date(transaction.date).toLocaleString()}</p>
          </div>
          
          <table className="w-full text-[10px] mb-4 border-collapse">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="text-left pb-1 uppercase">Item</th>
                <th className="text-center pb-1 uppercase">Qty</th>
                <th className="text-right pb-1 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item) => (
                <tr key={crypto.randomUUID()}>
                  <td className="py-1 align-top leading-tight">{item.name}</td>
                  <td className="py-1 text-center align-top">{item.quantity}</td>
                  <td className="py-1 text-right align-top whitespace-nowrap">₦{(item.priceAtSale * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="border-t border-dashed border-black my-2"></div>
          
          <div className="space-y-1">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span>
              <span>₦{transaction.total.toFixed(2)}</span>
            </div>
            <div className="text-[10px] uppercase pt-1">
              Payment: {transaction.paymentMethod === "CREDIT" ? "STORE CREDIT" : transaction.paymentMethod}
            </div>
            {transaction.debtorName ? (
              <div className="text-[10px] font-bold">
                DEBTOR: {transaction.debtorName}
              </div>
            ) : null}
          </div>
          
          <div className="border-t border-dashed border-black my-4"></div>
          
          <div className="text-center text-[10px] space-y-1">
            <p className="font-medium">Thank you for your patronage!</p>
            <p>Please come again.</p>
            <div className="pt-4 flex flex-col items-center">
              <div className="w-full border-t border-gray-200 my-1"></div>
              <p className="italic text-[8px] text-gray-500">Charity Corner POS</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
PrintableReceipt.displayName = "PrintableReceipt";
