import React from 'react';
import {
  LayoutDashboard,
  Sprout,
  Package,
  ShoppingCart,
  Receipt,
  IndianRupee,
  TrendingUp,
  Users,
  FileSpreadsheet,
  BookOpen,
  Database,
  Languages,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export type ActiveTab =
  | 'dashboard'
  | 'production'
  | 'inventory'
  | 'orders'
  | 'sales'
  | 'expenses'
  | 'profit-loss'
  | 'contacts'
  | 'reports'
  | 'advisor'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  onOpenSettings,
}) => {
  const { language, setLanguage, t, farmProfile, supabaseConnected } = useFarm();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'production', label: t.navProduction, icon: Sprout },
    { id: 'inventory', label: t.navInventory, icon: Package },
    { id: 'orders', label: t.navOrders, icon: ShoppingCart },
    { id: 'sales', label: t.navSales, icon: Receipt },
    { id: 'expenses', label: t.navExpenses, icon: IndianRupee },
    { id: 'profit-loss', label: t.navProfitLoss, icon: TrendingUp },
    { id: 'contacts', label: t.navContacts, icon: Users },
    { id: 'reports', label: t.navReports, icon: FileSpreadsheet },
    { id: 'advisor', label: t.navAdvisor, icon: BookOpen },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              {/* Mushroom Cap Custom Vector Icon */}
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 13c0-4.5 4-8 9-8s9 3.5 9 8c0 1-1 2-2 2H5c-1 0-2-1-2-2z" fill="currentColor" fillOpacity="0.2" />
                <path d="M10 15v5a2 2 0 0 0 4 0v-5" />
                <circle cx="8" cy="10" r="1" fill="currentColor" />
                <circle cx="16" cy="10" r="1" fill="currentColor" />
                <circle cx="12" cy="8" r="1" fill="currentColor" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="block font-bold tracking-tight text-neutral-900 text-base">
                Mushroom Farm
              </span>
              <span className="block text-xs font-medium text-emerald-700">
                Manager India
              </span>
            </div>
          </div>
        </div>

        {/* Farm Profile Summary Banner */}
        <div className="border-b border-neutral-100 bg-neutral-50/75 px-5 py-3 text-xs text-neutral-600">
          <p className="font-semibold text-neutral-900 truncate">{farmProfile.name}</p>
          <p className="text-neutral-500 truncate text-[11px]">{farmProfile.address.split(',')[1] || farmProfile.address}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-700' : 'text-neutral-400 group-hover:text-neutral-700'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Language & Supabase Footer */}
        <div className="border-t border-neutral-200 p-3 space-y-2 bg-neutral-50/50">
          {/* Language Switch */}
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-1 text-xs">
            <span className="flex items-center gap-1.5 px-2 font-medium text-neutral-600">
              <Languages className="h-3.5 w-3.5 text-neutral-400" />
              Lang
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLanguage('en')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  language === 'hi'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Supabase Connection Button */}
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-emerald-600" />
              <span>Database Backend</span>
            </div>
            {supabaseConnected ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-neutral-600">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Local / Setup
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
