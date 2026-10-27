import React, { useMemo } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Receipt,
  Sprout,
  Info,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { calculateFinancialSummary, formatINR, formatKg } from '../utils/calculations';

export const ProfitLossView: React.FC = () => {
  const { t, sales, expenses, batches } = useFarm();

  const financialSummary = useMemo(() => {
    return calculateFinancialSummary(sales, expenses, batches);
  }, [sales, expenses, batches]);

  // Batch-wise profitability estimation:
  // For each batch: compare total batch production cost against revenue generated from sales of this variety
  const batchProfitability = useMemo(() => {
    return batches.map((b) => {
      // Find average selling price for this variety from sales
      const varietySales = sales.filter((s) => s.variety === b.variety);
      const varietyRevenue = varietySales.reduce((acc, s) => acc + s.totalAmount, 0);
      const varietySoldKg = varietySales.reduce((acc, s) => acc + s.quantityKg, 0);
      const avgPrice = varietySoldKg > 0 ? varietyRevenue / varietySoldKg : 170;

      const potentialRevenue = b.saleableKg * avgPrice;
      const estimatedProfit = potentialRevenue - b.totalBatchCost;
      const margin = potentialRevenue > 0 ? (estimatedProfit / potentialRevenue) * 100 : 0;

      return {
        batchId: b.id,
        variety: b.variety,
        status: b.status,
        saleableKg: b.saleableKg,
        totalCost: b.totalBatchCost,
        costPerKg: b.costPerKg,
        avgPrice: Math.round(avgPrice),
        estimatedRevenue: Math.round(potentialRevenue),
        estimatedProfit: Math.round(estimatedProfit),
        margin: Math.round(margin * 10) / 10,
      };
    });
  }, [batches, sales]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight">
            {t.navProfitLoss}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Financial ledger based on actual database records, strict accrual matching, and zero double-counting.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
          <Scale className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold">{t.accountingMethod}</span>
        </div>
      </div>

      {/* Accounting Method Disclosure Callout */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-xs text-neutral-700 space-y-1">
        <div className="flex items-center gap-2 font-bold text-neutral-900">
          <Info className="h-4 w-4 text-emerald-600" />
          <span>Accounting Standard Disclosure</span>
        </div>
        <p className="text-neutral-600 leading-relaxed">
          {t.accountingDisclosure} Direct crop costs (spawn, substrate, labour, electricity) are capitalized into
          batch production cost per kg. <strong>Cost of Goods Sold (COGS)</strong> is recognized only when mushrooms
          are delivered and sold. General farm overhead (rent, marketing, transport) is accounted as period operating expenses.
        </p>
      </div>

      {/* Primary Financial Ledger Summary (6 Core Metrics) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Total Sales Value */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Total Recognized Revenue</span>
          <span className="text-lg md:text-xl font-bold font-mono text-neutral-900">
            {formatINR(financialSummary.totalRevenue)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">Invoice billed value</span>
        </div>

        {/* 2. Payments Received */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Actual Cash Received</span>
          <span className="text-lg md:text-xl font-bold font-mono text-emerald-700">
            {formatINR(financialSummary.totalCashCollected)}
          </span>
          <span className="text-[11px] text-emerald-800 block mt-1">Realized liquidity</span>
        </div>

        {/* 3. Outstanding Payments */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Outstanding Receivables</span>
          <span className="text-lg md:text-xl font-bold font-mono text-amber-600">
            {formatINR(financialSummary.totalOutstanding)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">Customer balance due</span>
        </div>

        {/* 4. COGS */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Cost of Goods Sold (COGS)</span>
          <span className="text-lg md:text-xl font-bold font-mono text-neutral-700">
            {formatINR(financialSummary.cogs)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">Direct crop cost of sold kg</span>
        </div>

        {/* 5. Gross Profit */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">{t.grossProfit}</span>
          <span className="text-lg md:text-xl font-bold font-mono text-neutral-900">
            {formatINR(financialSummary.grossProfit)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">Revenue − COGS</span>
        </div>

        {/* 6. Net Profit */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">{t.kpiNetProfit}</span>
          <span
            className={`text-lg md:text-xl font-bold font-mono ${
              financialSummary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatINR(financialSummary.netProfit)}
          </span>
          <span className="text-[11px] text-neutral-500 block mt-1">
            Margin: <strong>{financialSummary.profitMargin}%</strong>
          </span>
        </div>
      </div>

      {/* Detailed P&L Statement Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-neutral-900 mb-4">
          Formal Profit & Loss Statement (Year-to-Date)
        </h3>

        <div className="space-y-3 text-xs">
          {/* Revenue Section */}
          <div className="border-b border-neutral-100 pb-2">
            <div className="flex justify-between items-center font-bold text-neutral-900 text-sm">
              <span>1. Total Recognized Revenue</span>
              <span className="font-mono text-emerald-800">{formatINR(financialSummary.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-neutral-500 pl-4 pt-1">
              <span>Fresh Mushroom Invoiced Sales:</span>
              <span className="font-mono">{formatINR(financialSummary.totalRevenue)}</span>
            </div>
          </div>

          {/* Direct Costs / COGS Section */}
          <div className="border-b border-neutral-100 pb-2">
            <div className="flex justify-between items-center font-bold text-neutral-900 text-sm">
              <span>2. Cost of Goods Sold (COGS)</span>
              <span className="font-mono text-neutral-800">- {formatINR(financialSummary.cogs)}</span>
            </div>
            <div className="flex justify-between text-neutral-500 pl-4 pt-1">
              <span>Batch Harvest Production Cost (Sold Qty × Unit Cost/kg):</span>
              <span className="font-mono">{formatINR(financialSummary.cogs)}</span>
            </div>
          </div>

          {/* Gross Profit Subtotal */}
          <div className="rounded-lg bg-neutral-50 p-3 flex justify-between items-center font-bold text-sm text-neutral-900">
            <span>Gross Profit (Revenue − COGS):</span>
            <span className="font-mono text-emerald-700">{formatINR(financialSummary.grossProfit)}</span>
          </div>

          {/* Operating Expenses Section */}
          <div className="border-b border-neutral-100 pb-2 pt-2">
            <div className="flex justify-between items-center font-bold text-neutral-900 text-sm">
              <span>3. Operating & Farm Overhead Expenses</span>
              <span className="font-mono text-neutral-800">- {formatINR(financialSummary.totalExpenses)}</span>
            </div>
            <div className="pl-4 pt-1 space-y-1 text-neutral-500">
              <div className="flex justify-between">
                <span>Facility Rent, Fuel & Transportation:</span>
                <span className="font-mono">
                  {formatINR(
                    expenses
                      .filter((e) => e.category === 'Rent' || e.category === 'Transportation')
                      .reduce((s, e) => s + e.amount, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>General Farm Utilities & Electricity:</span>
                <span className="font-mono">
                  {formatINR(
                    expenses
                      .filter((e) => e.category === 'Electricity' || e.category === 'Water')
                      .reduce((s, e) => s + e.amount, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Maintenance, Marketing & Other Operations:</span>
                <span className="font-mono">
                  {formatINR(
                    expenses
                      .filter(
                        (e) =>
                          e.category !== 'Rent' &&
                          e.category !== 'Transportation' &&
                          e.category !== 'Electricity' &&
                          e.category !== 'Water'
                      )
                      .reduce((s, e) => s + e.amount, 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Net Profit Final Total */}
          <div
            className={`rounded-xl p-4 flex justify-between items-center font-extrabold text-base ${
              financialSummary.netProfit >= 0
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            <div>
              <span>NET REALIZED PROFIT</span>
              <span className="block text-xs font-normal opacity-80 mt-0.5">
                Gross Profit − Operating Expenses
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xl">{formatINR(financialSummary.netProfit)}</span>
              <span className="block text-xs font-semibold opacity-90">
                Net Margin: {financialSummary.profitMargin}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Variety-wise Profitability Breakdown */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <h3 className="text-base font-bold text-neutral-900 mb-3">
          Profitability by Mushroom Variety
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Mushroom Variety</th>
                <th className="py-2.5 px-3 text-right">Harvested</th>
                <th className="py-2.5 px-3 text-right">Sold Qty</th>
                <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                <th className="py-2.5 px-3 text-right">COGS (₹)</th>
                <th className="py-2.5 px-3 text-right">Gross Profit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {financialSummary.varietyBreakdown.map((item) => (
                <tr key={item.variety}>
                  <td className="py-2.5 px-3 font-semibold text-neutral-900">{item.variety}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatKg(item.harvestedKg)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatKg(item.soldKg)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">{formatINR(item.revenue)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">{formatINR(item.cogs)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                    {formatINR(item.grossProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch-wise Profitability Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <h3 className="text-base font-bold text-neutral-900 mb-3">
          Estimated Profitability by Production Batch
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Batch ID</th>
                <th className="py-2.5 px-3">Variety</th>
                <th className="py-2.5 px-3 text-right">Yield (kg)</th>
                <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Cost/kg (₹)</th>
                <th className="py-2.5 px-3 text-right">Est. Revenue (₹)</th>
                <th className="py-2.5 px-3 text-right">Est. Profit (₹)</th>
                <th className="py-2.5 px-3 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {batchProfitability.map((b) => (
                <tr key={b.batchId}>
                  <td className="py-2.5 px-3 font-mono font-semibold text-neutral-900">{b.batchId}</td>
                  <td className="py-2.5 px-3 text-neutral-800">{b.variety}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-800">
                    {b.saleableKg > 0 ? formatKg(b.saleableKg) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-700">{formatINR(b.totalCost)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{b.costPerKg > 0 ? formatINR(b.costPerKg) : '—'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">{formatINR(b.estimatedRevenue)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                    {formatINR(b.estimatedProfit)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    <span className={b.margin >= 20 ? 'text-emerald-700 font-semibold' : 'text-neutral-500'}>
                      {b.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
