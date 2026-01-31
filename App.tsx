
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Printer, ArrowLeft, Building2, Sparkles, Wand2, Search, CheckCircle, AlertCircle, Image as ImageIcon, Download, FileText } from 'lucide-react';
import { CompanyInfo, CashMemo, AppView, ProductItem } from './types';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import Layout from './components/Layout';
import InvoicePreview from './components/InvoicePreview';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const TAX_RATE = 0.10;

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('setup');
  const [company, setCompany] = useState<CompanyInfo | null>(storageService.getCompany());
  const [memos, setMemos] = useState<CashMemo[]>(storageService.getMemos());
  const [currentMemo, setCurrentMemo] = useState<CashMemo | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Create Memo Form State
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [items, setItems] = useState<ProductItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [signature, setSignature] = useState('');
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Setup State
  const [logoBase64, setLogoBase64] = useState<string>(company?.logo || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (company && view === 'setup') setView('dashboard');
  }, [company]);

  const addNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const info: CompanyInfo = {
      name: formData.get('name') as string,
      memoTitle: formData.get('memoTitle') as string || 'TAX INVOICE',
      memoSubTitle: formData.get('memoSubTitle') as string || 'Original for Recipient',
      description: formData.get('description') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      primaryColor: formData.get('primaryColor') as string || '#4f46e5',
      logo: logoBase64,
    };
    storageService.saveCompany(info);
    setCompany(info);
    addNotification('Company profile updated successfully!');
    setView('dashboard');
  };

  const useDemoData = () => {
    const demo: CompanyInfo = {
      name: 'Skyline Tech Solutions',
      memoTitle: 'OFFICIAL INVOICE',
      memoSubTitle: 'Premium Services Delivery',
      description: 'Expert digital transformation and software consulting.',
      phone: '+1 (800) 555-0199',
      email: 'billing@skylinetech.com',
      address: '77 Innovation Way, Suite 400\nSan Francisco, CA 94105',
      primaryColor: '#4f46e5',
      logo: '',
    };
    storageService.saveCompany(demo);
    setCompany(demo);
    addNotification('Demo mode activated!');
    setView('dashboard');
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ProductItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newItem = { ...item, ...updates };
        newItem.total = newItem.quantity * newItem.unitPrice;
        return newItem;
      }
      return item;
    }));
  };

  const handleAiRefine = async (id: string, text: string) => {
    if (!text) return;
    setAiLoadingId(id);
    const refined = await geminiService.refineDescription(text);
    updateItem(id, { description: refined });
    setAiLoadingId(null);
    addNotification('Description refined by AI', 'success');
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((acc, curr) => acc + curr.total, 0);
    const taxAmount = subtotal * TAX_RATE;
    return { subtotal, taxAmount, grandTotal: subtotal + taxAmount };
  };

  const handleGenerateMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    const validItems = items.filter(i => i.description.trim() !== '' && i.total > 0);
    if (validItems.length === 0) {
      addNotification('Please add at least one valid item', 'error');
      return;
    }

    const totals = calculateTotals();
    const memo: CashMemo = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      customer,
      items: validItems,
      date: new Date().toISOString(),
      ...totals,
      taxRate: TAX_RATE,
      paymentMethod,
      signature: signature || company.name,
      timestamp: Date.now()
    };
    setCurrentMemo(memo);
    setView('preview');
  };

  const handleSaveAndFinish = () => {
    if (currentMemo) {
      storageService.saveMemo(currentMemo);
      setMemos(storageService.getMemos());
      addNotification('Memo saved to history!');
      setView('dashboard');
      // Reset form
      setCustomer({ name: '', phone: '', email: '', address: '' });
      setItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }]);
      setSignature('');
    }
  };

  const handleDeleteMemo = (id: string) => {
    if (confirm('Permanently delete this invoice? This action cannot be undone.')) {
      storageService.deleteMemo(id);
      setMemos(storageService.getMemos());
      addNotification('Invoice deleted', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !currentMemo) return;
    setIsDownloading(true);
    addNotification('Preparing your PDF download...', 'success');

    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${currentMemo.id}_${currentMemo.customer.name.replace(/\s+/g, '_')}.pdf`);
      
      addNotification('Download complete!', 'success');
    } catch (error) {
      console.error('PDF Export Error:', error);
      addNotification('Failed to download PDF. Try printing to PDF instead.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Setup View
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-[120px] opacity-50"></div>

        <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-3xl shadow-2xl relative z-10 animate-in zoom-in duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                <Building2 size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Profile</h1>
                <p className="text-slate-500 font-medium">Create your digital presence</p>
              </div>
            </div>
            <button onClick={useDemoData} className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">
              Skip & Use Demo
            </button>
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Logo Upload */}
              <div className="flex flex-col items-center gap-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden"
                >
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Preview" className="w-full h-full object-contain p-4" />
                  ) : (
                    <>
                      <ImageIcon className="text-slate-300 mb-2" size={40} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">Click to upload logo</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleLogoChange} className="hidden" accept="image/*" />
              </div>

              {/* Form Fields */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                  <input name="name" defaultValue={company?.name} required className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" placeholder="Acme Inc." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Invoice Label</label>
                  <input name="memoTitle" defaultValue={company?.memoTitle || 'TAX INVOICE'} className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" placeholder="TAX INVOICE" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                  <input name="phone" defaultValue={company?.phone} required className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" placeholder="+1..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input name="email" type="email" defaultValue={company?.email} required className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" placeholder="billing@..." />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address</label>
                <textarea name="address" defaultValue={company?.address} required rows={2} className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none" placeholder="Business Address" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Brand Tagline</label>
                <textarea name="description" defaultValue={company?.description} rows={2} className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none" placeholder="What your business is about..." />
              </div>
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <Save size={20} />
              Save Company Profile
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={view} setView={setView}>
      {/* Notifications Portal */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300 ${n.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            {n.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm">{n.message}</span>
          </div>
        ))}
      </div>

      {view === 'dashboard' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Overview</h2>
              <p className="text-slate-500 font-medium">Welcome back to {company?.name}</p>
            </div>
            <button onClick={() => setView('create')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-95">
              <Plus size={24} />
              Create Digital Memo
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1 block">Total Revenue</span>
              <span className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">${memos.reduce((a, b) => a + b.grandTotal, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1 block">Memos Issued</span>
              <span className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{memos.length}</span>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1 block">Active Customers</span>
              <span className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{new Set(memos.map(m => m.customer.name)).size}</span>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Transactions</h3>
              <button onClick={() => setView('history')} className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">View All History</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {memos.slice(0, 5).map(memo => (
                    <tr key={memo.id} className="hover:bg-indigo-50/30 transition-colors cursor-pointer group" onClick={() => { setCurrentMemo(memo); setView('preview'); }}>
                      <td className="px-8 py-5 text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">#{memo.id}</td>
                      <td className="px-8 py-5 text-sm font-medium text-slate-700">{memo.customer.name}</td>
                      <td className="px-8 py-5 text-sm text-slate-400">{new Date(memo.date).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-sm text-right font-black text-slate-900">${memo.grandTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                  {memos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center text-slate-400 italic font-medium">No memos found. Let's create your first one!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="space-y-10 animate-in slide-in-from-bottom duration-500">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Memo</h2>
              <p className="text-slate-500 font-medium">Record a professional transaction.</p>
            </div>
            <button onClick={() => setView('dashboard')} className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all">
              <ArrowLeft size={24} />
            </button>
          </header>

          <form onSubmit={handleGenerateMemo} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-slate-900">1. Customer Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input required value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" placeholder="Customer Name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                    <input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" placeholder="Contact number" />
                  </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address</label>
                    <textarea rows={1} value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none" placeholder="Delivery or Billing address" />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-slate-900">2. Items & Services</h3>
                  <button type="button" onClick={addItem} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all uppercase tracking-widest">
                    Add Item
                  </button>
                </div>

                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end group animate-in slide-in-from-right duration-300">
                      <div className="md:col-span-6 space-y-1 relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                        <div className="relative">
                          <input required value={item.description} onChange={e => updateItem(item.id, { description: e.target.value })} className="w-full pl-5 pr-12 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="Product name or service..." />
                          <button 
                            type="button" 
                            disabled={!item.description || aiLoadingId === item.id}
                            onClick={() => handleAiRefine(item.id, item.description)}
                            title="Refine with AI"
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${item.description ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-300 pointer-events-none'}`}
                          >
                            {aiLoadingId === item.id ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <Wand2 size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-1 text-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Qty</label>
                        <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all text-center font-bold" />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right block pr-1">Price</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                            <input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all text-right font-bold" placeholder="0.00" />
                        </div>
                      </div>
                      <div className="md:col-span-1 pb-1 flex justify-center">
                        <button type="button" onClick={() => removeItem(item.id)} className={`p-3 transition-colors ${items.length > 1 ? 'text-slate-300 hover:text-rose-500' : 'text-slate-100 cursor-not-allowed'}`} disabled={items.length <= 1}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-8">
               <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-indigo-500/5 border border-slate-100 space-y-8 sticky top-10 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full -mr-12 -mt-12"></div>
                  
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-xl">Memo Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-400">Items Subtotal</span>
                      <span className="text-slate-900">${calculateTotals().subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-400">VAT (10%)</span>
                      <span className="text-slate-900">${calculateTotals().taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-6 border-t border-slate-50 flex justify-between items-end">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Grand Total</span>
                      <span className="text-4xl font-black text-indigo-600 tracking-tighter">${calculateTotals().grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-6 pt-2">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-700">
                            <option>Cash</option>
                            <option>Credit Card</option>
                            <option>Bank Transfer</option>
                            <option>Crypto Wallet</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Signatory</label>
                        <input value={signature} onChange={e => setSignature(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-medium" placeholder={company?.name} />
                     </div>
                  </div>

                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                    <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                    Review & Preview
                  </button>
               </div>
            </div>
          </form>
        </div>
      )}

      {view === 'preview' && currentMemo && company && (
        <div className="space-y-10 animate-in zoom-in-95 duration-500">
           <header className="flex flex-col md:flex-row md:items-center justify-between no-print gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Invoice Review</h2>
              <p className="text-slate-500 font-medium">Ready for print or direct download.</p>
            </div>
            <div className="flex flex-wrap gap-3">
                <button onClick={() => setView('create')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-6 py-3 rounded-2xl transition-all flex items-center gap-2">
                    <ArrowLeft size={18} /> Edit
                </button>
                <button 
                  onClick={handleDownloadPDF} 
                  disabled={isDownloading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {isDownloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download size={18} />}
                    Download PDF
                </button>
                <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-95">
                    <Printer size={18} /> Direct Print
                </button>
            </div>
          </header>

          <div ref={invoiceRef}>
            <InvoicePreview company={company} memo={currentMemo} />
          </div>

          <div className="flex justify-center no-print">
            <button onClick={handleSaveAndFinish} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 py-5 rounded-2xl shadow-2xl shadow-emerald-600/20 transition-all flex items-center gap-3 active:scale-95">
                <Save size={24} /> FINALIZE & SAVE TO SYSTEM
            </button>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Memo History</h2>
              <p className="text-slate-500 font-medium">Auditable record of all sales.</p>
            </div>
            <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto">
               <Search size={18} className="text-slate-300" />
               <input className="bg-transparent outline-none text-sm font-medium w-full md:w-64" placeholder="Search by name or ID..." />
            </div>
          </header>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-10 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memo ID</th>
                      <th className="px-10 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                      <th className="px-10 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-10 py-6 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</th>
                      <th className="px-10 py-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                      <th className="px-10 py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {memos.map(memo => (
                      <tr key={memo.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6 text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">#{memo.id}</td>
                        <td className="px-10 py-6 text-sm font-medium text-slate-700">{memo.customer.name}</td>
                        <td className="px-10 py-6 text-sm text-slate-400 font-medium">{new Date(memo.date).toLocaleDateString()}</td>
                        <td className="px-10 py-6">
                          <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider">{memo.paymentMethod}</span>
                        </td>
                        <td className="px-10 py-6 text-sm text-right font-black text-slate-900">${memo.grandTotal.toFixed(2)}</td>
                        <td className="px-10 py-6">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => { setCurrentMemo(memo); setView('preview'); }} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
                                <Printer size={16} />
                             </button>
                             <button onClick={() => handleDeleteMemo(memo.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                                <Trash2 size={16} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {memos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-10 py-24 text-center text-slate-400 italic font-medium">Your invoicing history is currently empty.</td>
                      </tr>
                    )}
                  </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
