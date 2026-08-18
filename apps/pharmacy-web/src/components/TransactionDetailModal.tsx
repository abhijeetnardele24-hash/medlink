import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: {
    id: string;
    date: string;
    grossAmount: number;
    status: string;
    type: string;
  };
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, onClose }) => {
  // Amazon/Flipkart style platform fee calculations
  const platformFeePercentage = 5; // 5% fee
  const gstOnFeePercentage = 18; // 18% GST on the fee

  const platformFee = (transaction.grossAmount * platformFeePercentage) / 100;
  const gstOnFee = (platformFee * gstOnFeePercentage) / 100;
  const totalDeductions = platformFee + gstOnFee;
  const netSettlement = transaction.grossAmount - totalDeductions;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        
        <div className="border-b border-gray-100 p-5 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Settlement Detail</h2>
              <p className="text-xs text-gray-500 font-medium tracking-wide">TXN: {transaction.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm text-gray-500 mb-1">Transaction Date</p>
              <p className="font-medium text-gray-900">{new Date(transaction.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={12} /> Settled
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 border-dashed">
              <span className="text-gray-600 font-medium">Customer Paid (Gross)</span>
              <span className="font-bold text-gray-900">₹{transaction.grossAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 pl-4 border-l-2 border-red-200">
              <span className="text-gray-500 text-sm">MedLink Platform Fee ({platformFeePercentage}%)</span>
              <span className="text-red-500 text-sm font-medium">-₹{platformFee.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 pl-4 border-l-2 border-red-200 border-b border-gray-100 border-dashed pb-4">
              <span className="text-gray-500 text-sm">GST on Fee ({gstOnFeePercentage}%)</span>
              <span className="text-red-500 text-sm font-medium">-₹{gstOnFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-4 bg-teal-50 px-4 rounded-xl border border-teal-100 mt-2">
              <span className="font-bold text-teal-900">Net Bank Settlement</span>
              <span className="text-xl font-bold text-emerald-600">₹{netSettlement.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-8 text-xs text-gray-400 text-center bg-gray-50 p-3 rounded-lg">
            This breakdown is for informational purposes. The net settlement amount will be credited to your registered bank account ending in **3409** within 2 business days.
          </div>
        </div>
        
      </div>
    </div>
  );
};
