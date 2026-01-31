
import React from 'react';
import { CompanyInfo, CashMemo } from '../types';

interface InvoicePreviewProps {
  company: CompanyInfo;
  memo: CashMemo;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ company, memo }) => {
  return (
    <div className="bg-white p-8 md:p-16 shadow-2xl rounded-[3rem] max-w-[850px] mx-auto border border-slate-100 memo-paper transition-all relative overflow-hidden group">
      {/* Brand Accent Bar */}
      <div className="absolute top-0 left-0 w-full h-3" style={{ background: company.primaryColor }}></div>
      
      {/* Decorative Watermark for Screen View */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-50 font-black text-[200px] pointer-events-none uppercase -rotate-12 select-none opacity-[0.03] z-0 leading-none no-print">
        {company.name.slice(0, 4)}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
          <div className="flex flex-col gap-4">
            {company.logo ? (
              <img src={company.logo} alt="Logo" className="h-20 w-auto object-contain self-start" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl" style={{ backgroundColor: company.primaryColor }}>
                {company.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{company.name}</h1>
              <p className="text-sm font-bold mt-2 text-slate-400 uppercase tracking-widest">{company.description}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-5xl font-black text-slate-200 tracking-tighter uppercase mb-2 select-none no-print">{company.memoTitle || 'INVOICE'}</h2>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2 print-only">{company.memoTitle || 'INVOICE'}</h2>
            <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase">{company.memoSubTitle}</p>
            <div className="mt-8 flex flex-col items-end gap-1">
              <div className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-black tracking-widest">#{memo.id}</div>
              <p className="text-slate-500 text-sm font-medium mt-1">
                {new Date(memo.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-16 mb-16">
          {/* Bill From */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Issued By</h3>
            <div className="text-sm text-slate-600 leading-relaxed font-medium">
              <p className="font-black text-slate-900 text-base mb-1">{company.name}</p>
              <p className="whitespace-pre-line text-slate-500 mb-2">{company.address}</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-slate-900 font-bold">{company.phone}</p>
                <p className="text-indigo-600">{company.email}</p>
              </div>
            </div>
          </div>
          {/* Bill To */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Billed To</h3>
            <div className="text-sm text-slate-600 leading-relaxed font-medium">
              <p className="font-black text-slate-900 text-base mb-1">{memo.customer.name}</p>
              <p className="whitespace-pre-line text-slate-500 mb-2">{memo.customer.address || 'No address provided'}</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-slate-900 font-bold">{memo.customer.phone || 'No phone'}</p>
                <p className="text-slate-500 italic text-xs">{memo.customer.email || 'No email'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mb-12">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-5 font-black text-slate-900 text-[10px] uppercase tracking-widest first:rounded-l-2xl">Description</th>
                <th className="px-6 py-5 font-black text-slate-900 text-[10px] uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-5 font-black text-slate-900 text-[10px] uppercase tracking-widest text-right">Rate</th>
                <th className="px-6 py-5 font-black text-slate-900 text-[10px] uppercase tracking-widest text-right last:rounded-r-2xl">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memo.items.map((item) => (
                <tr key={item.id} className="group/row hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-6 text-sm text-slate-700 font-bold">{item.description}</td>
                  <td className="px-6 py-6 text-sm text-slate-500 text-center font-bold">{item.quantity}</td>
                  <td className="px-6 py-6 text-sm text-slate-500 text-right font-medium">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-6 text-sm text-slate-900 font-black text-right">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-t border-slate-100 pt-12">
          <div className="flex-1 space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Payment Summary</h4>
                <div className="text-sm font-bold text-slate-900 bg-slate-50 px-6 py-4 rounded-2xl flex items-center justify-between border border-slate-100">
                  <span className="text-slate-400 font-medium">Method</span>
                  <span>{memo.paymentMethod}</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Invoice Status</h4>
                <div className="bg-emerald-50 text-emerald-600 px-6 py-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-emerald-400 font-medium text-sm">Status</span>
                  <span className="font-black text-sm uppercase tracking-tighter">PAID</span>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notice & Terms</h4>
               <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
                  This document serves as an official receipt of payment for services rendered or goods sold. 
                  Fees are non-refundable unless stated otherwise. For billing inquiries, contact our support line.
               </p>
            </div>
          </div>

          <div className="w-full md:w-80 space-y-4">
            <div className="flex justify-between items-center text-sm font-bold px-4">
              <span className="text-slate-400 uppercase tracking-widest text-[10px]">Net Total</span>
              <span className="text-slate-900 text-base">${memo.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold px-4">
              <span className="text-slate-400 uppercase tracking-widest text-[10px]">Taxes ({(memo.taxRate * 100).toFixed(0)}%)</span>
              <span className="text-slate-900 text-base">${memo.taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-6 px-6 py-5 rounded-3xl flex justify-between items-center border-t-2 border-slate-900 bg-slate-900 shadow-2xl shadow-slate-200">
              <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Payable Amount</span>
              <span className="text-3xl font-black text-white tracking-tighter">${memo.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="mt-20 pt-10 border-t border-slate-50 flex justify-between items-end">
          <div className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
              PROMEMO SYSTEM • DIGITAL AUTHENTICATION NO: {memo.timestamp}
          </div>
          <div className="text-center min-w-[200px]">
            <div className="h-12 mb-2 text-slate-900 text-2xl font-serif italic flex items-center justify-center">
              {memo.signature}
            </div>
            <div className="border-t-2 border-slate-900 pt-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
      
      {/* Print Footer */}
      <div className="hidden print:block fixed bottom-0 left-0 w-full text-center text-[10px] text-slate-300 py-4 uppercase tracking-widest">
        Thank you for choosing {company.name} • Professional Invoice
      </div>
    </div>
  );
};

export default InvoicePreview;
