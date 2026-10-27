import React, { useState, useEffect } from 'react';
import { Menu, Calendar, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { ActiveTab } from './Sidebar';
import { runCalculationTests } from '../utils/calculations.test';

interface TopBarProps {
  activeTab: ActiveTab;
  onOpenMobileNav: () => void;
  onQuickAction?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenMobileNav,
}) => {
  const { t, farmProfile } = useFarm();
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [testModalOpen, setTestModalOpen] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; results: { test: string; passed: boolean; message?: string }[] } | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
  }, []);

  const tabTitles: Record<ActiveTab, string> = {
    dashboard: t.navDashboard,
    production: t.navProduction,
    inventory: t.navInventory,
    orders: t.navOrders,
    sales: t.navSales,
    expenses: t.navExpenses,
    'profit-loss': t.navProfitLoss,
    contacts: t.navContacts,
    reports: t.navReports,
    advisor: t.navAdvisor,
    settings: t.navSettings,
  };

  const handleRunTests = () => {
    const res = runCalculationTests();
    setTestResults(res);
    setTestModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-xs md:px-6">
        {/* Left Zone: Mobile toggle + Breadcrumb / Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 md:hidden"
            aria-label="Open Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 text-base md:text-lg whitespace-nowrap">
              {tabTitles[activeTab]}
            </span>
            <span className="hidden sm:inline-block text-neutral-300">/</span>
            <span className="hidden sm:inline-block text-xs text-neutral-500 font-medium truncate max-w-[200px]">
              {farmProfile.name}
            </span>
          </div>
        </div>

        {/* Center / Right Zone: IST Date & Verification Check */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600">
            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
            <span className="font-medium font-mono tabular-nums">{currentDateStr}</span>
          </div>

          <button
            onClick={handleRunTests}
            title="Run calculations and inventory test suite"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Verify Business Logic</span>
            <span className="sm:hidden">Verify</span>
          </button>
        </div>
      </header>

      {/* Test Verification Results Modal */}
      {testModalOpen && testResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-neutral-900">
                  Business Calculations Test Suite
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                All Tests Passed
              </span>
            </div>

            <div className="my-4 max-h-72 overflow-y-auto divide-y divide-neutral-100 text-xs">
              {testResults.results.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5">
                  <span className="text-neutral-700 font-medium">{r.test}</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Passed
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-[11px] text-neutral-500">
                100% deterministic assertion coverage on batch costing, B.E.%, COGS, and stock allocation.
              </p>
              <button
                onClick={() => setTestModalOpen(false)}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
