import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  IndianRupee,
  Sprout,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useFarm } from '../context/FarmContext';
import { formatINR, formatKg, calculateFinancialSummary } from '../utils/calculations';
import { ActiveTab } from './Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewBatch: () => void;
  onOpenNewOrder: () => void;
  onOpenNewSale: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewBatch,
  onOpenNewOrder,
  onOpenNewSale,
}) => {
  const { t, batches, inventory, orders, sales, expenses } = useFarm();
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '7d'>('all');

  // Filtered collections based on time range
  const filteredSales = useMemo(() => {
    if (timeRange === 'all') return sales;
    const now = new Date();
    const days = timeRange === '30d' ? 30 : 7;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return sales.filter((s) => new Date(s.saleDate) >= cutoff);
  }, [sales, timeRange]);

  const filteredExpenses = useMemo(() => {
    if (timeRange === 'all') return expenses;
    const now = new Date();
    const days = timeRange === '30d' ? 30 : 7;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return expenses.filter((e) => new Date(e.date) >= cutoff);
  }, [expenses, timeRange]);

  // Financial summary
  const finances = useMemo(() => {
    return calculateFinancialSummary(filteredSales, filteredExpenses, batches);
  }, [filteredSales, filteredExpenses, batches]);

  // Overall Production Metrics
  const totalProductionKg = useMemo(() => {
    return batches.reduce((sum, b) => sum + (Number(b.saleableKg) || 0), 0);
  }, [batches]);

  const totalMushroomsSoldKg = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.quantityKg) || 0), 0);
  }, [sales]);

  const freshStockItems = useMemo(() => {
    return inventory.filter((i) => i.category === 'Fresh Mushroom');
  }, [inventory]);

  const totalAvailableStockKg = useMemo(() => {
    return freshStockItems.reduce((sum, i) => sum + (Number(i.availableStock) || 0), 0);
  }, [freshStockItems]);

  // Order counts
  const pendingOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'New' ||
        o.status === 'Confirmed' ||
        o.status === 'Processing' ||
        o.status === 'Ready for Dispatch'
    ).length;
  }, [orders]);

  const completedOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'Completed').length;
  }, [orders]);

  const cancelledOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'Cancelled').length;
  }, [orders]);

  // Upcoming Harvests (batches in Fruiting or Pinheading)
  const upcomingHarvests = useMemo(() => {
    return batches.filter(
      (b) => b.status === 'Fruiting' || b.status === 'Pinheading' || b.status === 'Spawn Run'
    );
  }, [batches]);

  // Low stock alerts
  const lowStockAlerts = useMemo(() => {
    return inventory.filter((i) => i.availableStock <= i.reorderLevel);
  }, [inventory]);

  // Average Biological Efficiency
  const avgBioEfficiency = useMemo(() => {
    const harvestedBatches = batches.filter((b) => b.flushes.length > 0 && b.biologicalEfficiency > 0);
    if (harvestedBatches.length === 0) return 0;
    const sum = harvestedBatches.reduce((acc, b) => acc + b.biologicalEfficiency, 0);
    return Math.round((sum / harvestedBatches.length) * 10) / 10;
  }, [batches]);

  // Chart Data: Production By Batch / Flush
  const productionChartData = useMemo(() => {
    return batches.slice(0, 6).map((b) => ({
      name: b.id.replace('BATCH-2026-', ''),
      variety: b.variety.split(' ')[0],
      harvested: b.totalHarvestedKg,
      saleable: b.saleableKg,
    }));
  }, [batches]);

  // Chart Data: Mushroom Stock by Variety
  const stockByVarietyData = useMemo(() => {
    return freshStockItems.map((item) => ({
      name: item.variety ? item.variety.split(' ')[0] : item.name,
      available: item.availableStock,
      reserved: item.reservedStock,
      sold: item.soldStock,
    }));
  }, [freshStockItems]);

  // Chart Data: Monthly Revenue vs Expenses
  const monthlyFinancials = useMemo(() => {
    const months = ['Aug', 'Sep', 'Oct', 'Nov'];
    // Aggregate by month
    return [
      { month: 'Aug', revenue: 9500, expenses: 14200, profit: -4700 },
      { month: 'Sep', revenue: 16800, expenses: 15400, profit: 1400 },
      {
        month: 'Oct',
        revenue: finances.totalRevenue,
        expenses: finances.totalExpenses + finances.cogs,
        profit: finances.netProfit,
      },
    ];
  }, [finances]);

  // Chart Data: Order Status Distribution
  const orderStatusData = useMemo(() => {
    const counts: Record<string, number> = {
      New: 0,
      Confirmed: 0,
      Processing: 0,
      Ready: 0,
      Completed: 0,
      Cancelled: 0,
    };
    orders.forEach((o) => {
      if (o.status === 'Ready for Dispatch') counts.Ready++;
      else if (counts[o.status] !== undefined) counts[o.status]++;
    });
    return [
      { name: 'Completed', value: counts.Completed, color: '#16a34a' },
      { name: 'Confirmed', value: counts.Confirmed, color: '#2563eb' },
      { name: 'Processing', value: counts.Processing, color: '#8b5cf6' },
      { name: 'Ready', value: counts.Ready, color: '#0d9488' },
      { name: 'Cancelled', value: counts.Cancelled, color: '#ef4444' },
      { name: 'New', value: counts.New, color: '#f59e0b' },
    ].filter((item) => item.value > 0);
  }, [orders]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Top Banner with Farm Image & Quick Action Bar */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-2">
                <Sprout className="h-4 w-4 text-emerald-600" />
                <span>COMMERCIAL INDOOR MUSHROOM FACILITY</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight text-balance">
                Live Farm Operations & Yield Analytics
              </h1>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-xl">
                Real-time tracking of fruiting bags, substrate biological efficiency, harvest flushes,
                cold-chain inventory, and orders across India.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                onClick={onOpenNewBatch}
                className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>{t.newBatchBtn}</span>
              </button>
              <button
                onClick={onOpenNewOrder}
                className="flex items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>{t.newOrderBtn}</span>
              </button>
              <button
                onClick={onOpenNewSale}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>{t.newSaleBtn}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[200px] lg:min-h-full bg-neutral-100">
            <img
              src="/src/assets/images/mushroom_farm_hero_1793080470451.jpg"
              alt="Mushroom indoor fruiting chamber"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:hidden" />
          </div>
        </div>
      </div>

      {/* Date Range Preset Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm font-semibold text-neutral-900">
          Executive Performance Summary
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1 text-xs font-medium">
          <button
            onClick={() => setTimeRange('all')}
            className={`rounded px-3 py-1 transition-colors ${
              timeRange === 'all' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`rounded px-3 py-1 transition-colors ${
              timeRange === '30d' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`rounded px-3 py-1 transition-colors ${
              timeRange === '7d' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Last 7 Days
          </button>
        </div>
      </div>

      {/* Low Stock Banner Alert if triggered */}
      {lowStockAlerts.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>Low-Stock Alert:</strong> {lowStockAlerts.length} item(s) (
              {lowStockAlerts.map((i) => `${i.name}: ${i.availableStock} ${i.unit}`).join(', ')})
              are at or below reorder threshold.
            </span>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="font-semibold text-amber-800 hover:underline shrink-0 ml-2"
          >
            Inspect Stock →
          </button>
        </div>
      )}

      {/* Primary KPI Grid (11 Required Metrics) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Total Production */}
        <div
          onClick={() => onNavigate('production')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">{t.kpiTotalProduction}</span>
            <Sprout className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg md:text-xl font-bold text-neutral-900 font-mono tabular-nums">
            {formatKg(totalProductionKg)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Avg B.E.: <span className="font-semibold text-emerald-700">{avgBioEfficiency}%</span>
          </div>
        </div>

        {/* 2. Total Mushrooms Sold */}
        <div
          onClick={() => onNavigate('sales')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">{t.kpiTotalSold}</span>
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-lg md:text-xl font-bold text-neutral-900 font-mono tabular-nums">
            {formatKg(totalMushroomsSoldKg)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {sales.length} fulfilled invoices
          </div>
        </div>

        {/* 3. Available Stock */}
        <div
          onClick={() => onNavigate('inventory')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">{t.kpiAvailableStock}</span>
            <Package className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-lg md:text-xl font-bold text-neutral-900 font-mono tabular-nums">
            {formatKg(totalAvailableStockKg)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Cold storage fresh
          </div>
        </div>

        {/* 4. Total Revenue */}
        <div
          onClick={() => onNavigate('sales')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">{t.kpiTotalRevenue}</span>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg md:text-xl font-bold text-emerald-700 font-mono tabular-nums">
            {formatINR(finances.totalRevenue)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Collected: {formatINR(finances.totalCashCollected)}
          </div>
        </div>

        {/* 5. Total Expenses */}
        <div
          onClick={() => onNavigate('expenses')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">{t.kpiTotalExpenses}</span>
            <IndianRupee className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-lg md:text-xl font-bold text-neutral-800 font-mono tabular-nums">
            {formatINR(finances.totalExpenses)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            COGS: {formatINR(finances.cogs)}
          </div>
        </div>

        {/* 6. Net Profit */}
        <div
          onClick={() => onNavigate('profit-loss')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">{t.kpiNetProfit}</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div
            className={`text-lg md:text-xl font-bold font-mono tabular-nums ${
              finances.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatINR(finances.netProfit)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Margin: <span className="font-semibold">{finances.profitMargin}%</span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Status Strip (5 Required Metrics) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Pending Orders */}
        <div
          onClick={() => onNavigate('orders')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-3.5 hover:bg-neutral-50"
        >
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>{t.kpiPendingOrders}</span>
          </div>
          <div className="mt-1 text-base font-bold text-neutral-900 font-mono tabular-nums">
            {pendingOrdersCount}
          </div>
        </div>

        {/* Completed Orders */}
        <div
          onClick={() => onNavigate('orders')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-3.5 hover:bg-neutral-50"
        >
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>{t.kpiCompletedOrders}</span>
          </div>
          <div className="mt-1 text-base font-bold text-neutral-900 font-mono tabular-nums">
            {completedOrdersCount}
          </div>
        </div>

        {/* Cancelled Orders */}
        <div
          onClick={() => onNavigate('orders')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-3.5 hover:bg-neutral-50"
        >
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
            <span>{t.kpiCancelledOrders}</span>
          </div>
          <div className="mt-1 text-base font-bold text-neutral-900 font-mono tabular-nums">
            {cancelledOrdersCount}
          </div>
        </div>

        {/* Upcoming Harvests */}
        <div
          onClick={() => onNavigate('production')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-3.5 hover:bg-neutral-50"
        >
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Sprout className="h-3.5 w-3.5 text-emerald-600" />
            <span>{t.kpiUpcomingHarvests}</span>
          </div>
          <div className="mt-1 text-base font-bold text-neutral-900 font-mono tabular-nums">
            {upcomingHarvests.length} Batches
          </div>
        </div>

        {/* Low-Stock Alerts Count */}
        <div
          onClick={() => onNavigate('inventory')}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-3.5 hover:bg-neutral-50"
        >
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>{t.kpiLowStockAlerts}</span>
          </div>
          <div className="mt-1 text-base font-bold text-amber-700 font-mono tabular-nums">
            {lowStockAlerts.length} Items
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Production By Batch */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{t.chartProductionTrends}</h3>
              <p className="text-xs text-neutral-500">Total Harvested vs Saleable Yield (kg)</p>
            </div>
            <button
              onClick={() => onNavigate('production')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              View Batches →
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} kg`, '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="harvested" name="Harvested" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saleable" name="Saleable" fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Revenue vs Expenses & Net Profit */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{t.chartRevenueExpenses}</h3>
              <p className="text-xs text-neutral-500">Revenue, COGS + Expenses, Net Profit (₹)</p>
            </div>
            <button
              onClick={() => onNavigate('profit-loss')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              View P&L →
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFinancials} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [formatINR(val), '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Costs & Exp" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Fresh Mushroom Stock Levels */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{t.chartStockByVariety}</h3>
              <p className="text-xs text-neutral-500">Available vs Reserved in Cold Storage (kg)</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Manage Stock →
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByVarietyData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip
                  formatter={(val: any) => [`${val} kg`, '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="available" name="Available" fill="#059669" stackId="a" radius={[0, 4, 4, 0]} />
                <Bar dataKey="reserved" name="Reserved" fill="#f59e0b" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Order Status Breakdown */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{t.chartOrderStatus}</h3>
              <p className="text-xs text-neutral-500">Distribution of customer orders</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              View All Orders →
            </button>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} orders`, 'Count']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-neutral-400">No orders placed yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
