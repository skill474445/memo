
import React from 'react';
import { Home, PlusCircle, History, Settings, FileText, Menu, X } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setView: (view: AppView) => void;
  isPrintView?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, isPrintView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  if (isPrintView) return <>{children}</>;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'create', label: 'Create Memo', icon: PlusCircle },
    { id: 'history', label: 'History', icon: History },
    { id: 'setup', label: 'Company Profile', icon: Settings },
  ];

  const handleNavClick = (id: AppView) => {
    setView(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 no-print font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <FileText size={20} />
          </div>
          <h1 className="font-black text-lg tracking-tighter text-slate-900 uppercase">ProMemo</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar / Mobile Overlay */}
      <aside className={`fixed inset-0 z-40 md:relative md:inset-auto w-full md:w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 hidden md:flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-200">
            <FileText size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter text-slate-900 leading-none">PROMEMO</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Digital Billing</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 md:py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as AppView)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-300 group-hover:text-indigo-500'} transition-colors`} />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-50 hidden md:block">
          <div className="bg-indigo-50/50 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
            <p className="text-[10px] text-indigo-600 font-black tracking-widest mb-2">INTELLIGENT SUITE</p>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">Gemini 3 Flash enabled for professional line items.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12 relative">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
