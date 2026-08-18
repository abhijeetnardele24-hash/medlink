import React from 'react';
import { X, Printer, Download } from 'lucide-react';

interface InvoiceModalProps {
  orderId: string;
  patientName: string;
  total: number;
  date: string;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ orderId, patientName, total, date, onClose }) => {
  // Mock data for the invoice breakdown
  const pharmacyDetails = {
    name: "MedLink Official Pharmacy",
    address: "123 Health Avenue, Medical District, City Center, 400001",
    gstin: "27AADCM1234E1Z5",
    dlNumber: "MH-PH-2023-8911"
  };

  const doctorDetails = {
    name: "Dr. Ananya Sharma",
    regNo: "MCI-45892"
  };

  const items = [
    { id: 1, name: "Paracetamol 500mg", hsn: "3004", batch: "B2931", exp: "12/2027", qty: 2, rate: 50.00, amount: 100.00, gst: 12 },
    { id: 2, name: "Amoxicillin 250mg", hsn: "3004", batch: "A1092", exp: "08/2026", qty: 1, rate: 120.00, amount: 120.00, gst: 12 },
    { id: 3, name: "Cetirizine 10mg", hsn: "3004", batch: "C9021", exp: "01/2028", qty: 3, rate: 30.00, amount: 90.00, gst: 12 },
  ];

  const subTotal = items.reduce((acc, item) => acc + item.amount, 0);
  // Assuming total is inclusive of GST for this demo, let's calculate backwards or just use raw amounts.
  // For standard Indian medical invoice, usually amounts are exclusive, and GST is added.
  const cgstAmount = subTotal * 0.06;
  const sgstAmount = subTotal * 0.06;
  const grandTotal = subTotal + cgstAmount + sgstAmount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header Actions */}
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-100 p-4 flex justify-between items-center z-10 no-print">
          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors border border-gray-200"
            >
              <Printer size={18} /> Print
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 font-medium transition-colors border border-teal-200">
              <Download size={18} /> Download PDF
            </button>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Invoice Body */}
        <div className="p-8 bg-white" id="printable-invoice">
          
          <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-8">
            <div>
              <h1 className="text-2xl font-black tracking-[0.12em] uppercase text-gray-900" style={{ fontFamily: '"Inter", sans-serif', margin: 0, lineHeight: 1 }}>
                Med<span className="font-light">Link</span>
              </h1>
              <p className="text-xs text-teal-600 font-medium tracking-wider uppercase mt-1 mb-4">Pharmacy Network</p>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-bold text-gray-900">{pharmacyDetails.name}</p>
                <p>{pharmacyDetails.address}</p>
                <p>GSTIN: <span className="font-medium text-gray-900">{pharmacyDetails.gstin}</span></p>
                <p>DL No: <span className="font-medium text-gray-900">{pharmacyDetails.dlNumber}</span></p>
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-3xl font-light text-gray-400 mb-4 uppercase tracking-widest">Tax Invoice</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Invoice No: <span className="font-medium text-gray-900">INV-{orderId.replace('ORD-', '')}</span></p>
                <p>Date: <span className="font-medium text-gray-900">{new Date(date).toLocaleDateString('en-IN')}</span></p>
                <p>Time: <span className="font-medium text-gray-900">{new Date(date).toLocaleTimeString('en-IN')}</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Billed To (Patient)</h3>
              <p className="font-bold text-gray-900">{patientName}</p>
              <p className="text-sm text-gray-600">Registered MedLink User</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Prescribing Doctor</h3>
              <p className="font-bold text-gray-900">{doctorDetails.name}</p>
              <p className="text-sm text-gray-600">Reg No: {doctorDetails.regNo}</p>
            </div>
          </div>

          <table className="w-full text-left mb-8 border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white text-xs uppercase tracking-wider">
                <th className="p-3 rounded-tl-lg font-medium">S.No</th>
                <th className="p-3 font-medium">Item Description</th>
                <th className="p-3 font-medium">HSN</th>
                <th className="p-3 font-medium">Batch</th>
                <th className="p-3 font-medium">Exp</th>
                <th className="p-3 font-medium text-right">Qty</th>
                <th className="p-3 font-medium text-right">Rate (₹)</th>
                <th className="p-3 rounded-tr-lg font-medium text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-200 border-b border-gray-200">
              {items.map((item, index) => (
                <tr key={item.id} className="text-gray-700">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-medium text-gray-900">{item.name}</td>
                  <td className="p-3 text-gray-500">{item.hsn}</td>
                  <td className="p-3 text-gray-500">{item.batch}</td>
                  <td className="p-3 text-gray-500">{item.exp}</td>
                  <td className="p-3 text-right">{item.qty}</td>
                  <td className="p-3 text-right">{item.rate.toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-12">
            <div className="w-80">
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>Subtotal (Exclusive of Tax)</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>CGST @ 6%</span>
                <span>₹{cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200">
                <span>SGST @ 6%</span>
                <span>₹{sgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-4 text-xl font-bold text-gray-900 bg-gray-50 px-4 rounded-xl mt-2 border border-gray-200">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-xs text-gray-500 text-center">
            <p className="font-medium text-gray-700 mb-1">Declaration</p>
            <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            <p className="mt-4 italic">This is a computer generated invoice and does not require a physical signature.</p>
          </div>

        </div>
      </div>
    </div>
  );
};
