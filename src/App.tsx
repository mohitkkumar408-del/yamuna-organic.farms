/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { ProductionView } from './components/ProductionView';
import { InventoryView } from './components/InventoryView';
import { OrdersView } from './components/OrdersView';
import { SalesView } from './components/SalesView';
import { ExpensesView } from './components/ExpensesView';
import { ProfitLossView } from './components/ProfitLossView';
import { CustomersSuppliersView } from './components/CustomersSuppliersView';
import { ReportsView } from './components/ReportsView';
import { AdvisorView } from './components/AdvisorView';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Shortcuts to open modals in respective views
  const handleOpenNewBatch = () => {
    setActiveTab('production');
  };

  const handleOpenNewOrder = () => {
    setActiveTab('orders');
  };

  const handleOpenNewSale = () => {
    setActiveTab('sales');
  };

  return (
    <div className="flex min-h-screen bg-neutral-100/60 font-sans text-neutral-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
        onOpenSettings={() => setSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar with IST Date, Title, and Verification Suite */}
        <TopBar
          activeTab={activeTab}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        {/* View Content Port */}
        <main className="flex-1 overflow-y-auto pb-12">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewBatch={handleOpenNewBatch}
              onOpenNewOrder={handleOpenNewOrder}
              onOpenNewSale={handleOpenNewSale}
            />
          )}

          {activeTab === 'production' && <ProductionView />}

          {activeTab === 'inventory' && <InventoryView />}

          {activeTab === 'orders' && (
            <OrdersView onNavigateToSales={() => setActiveTab('sales')} />
          )}

          {activeTab === 'sales' && <SalesView />}

          {activeTab === 'expenses' && <ExpensesView />}

          {activeTab === 'profit-loss' && <ProfitLossView />}

          {activeTab === 'contacts' && <CustomersSuppliersView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'advisor' && <AdvisorView />}
        </main>
      </div>

      {/* Database Setup & Farm Configuration Modal */}
      <SupabaseSetupModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FarmProvider>
      <AppContent />
    </FarmProvider>
  );
}
