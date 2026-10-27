import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Layers,
  ArrowDownToLine,
  Sprout,
  Package,
  Receipt,
  IndianRupee,
  TrendingUp,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { formatINR, formatKg, calculateFinancialSummary } from '../utils/calculations';

type ReportType =
  | 'production'
  | 'sales'
  | 'orders'
  | 'inventory'
  | 'expenses'
  | 'profit-loss'
  | 'customer-balances'
  | 'batch-profitability';

export const ReportsView: React.FC = () => {
  const { t, batches, inventory, orders, sales, expenses, customers, farmProfile } = useFarm();

  const [reportType, setReportType] = useState<ReportType>('production');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const finances = useMemo(() => {
    return calculateFinancialSummary(sales, expenses, batches);
  }, [sales, expenses, batches]);

  // Export CSV Handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `MushroomFarm_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    switch (reportType) {
      case 'production':
        headers = ['Batch ID', 'Variety', 'Start Date', 'Expected Harvest', 'Bags', 'Substrate Type', 'Substrate (kg)', 'Total Cost (INR)', 'Saleable (kg)', 'Cost/kg (INR)', 'B.E. (%)', 'Status'];
        rows = batches.map((b) => [
          b.id,
          `"${b.variety}"`,
          b.startDate,
          b.expectedHarvestDate,
          b.bagCount,
          `"${b.substrateType}"`,
          b.substrateQuantityKg,
          b.totalBatchCost,
          b.saleableKg,
          b.costPerKg,
          b.biologicalEfficiency,
          b.status,
        ]);
        break;

      case 'sales':
        headers = ['Invoice ID', 'Date', 'Customer Name', 'Phone', 'Variety', 'Qty (kg)', 'Rate (INR)', 'Total Amount (INR)', 'Received (INR)', 'Outstanding (INR)', 'Method', 'Status'];
        rows = sales.map((s) => [
          s.id,
          s.saleDate,
          `"${s.customerName}"`,
          s.customerPhone,
          `"${s.variety}"`,
          s.quantityKg,
          s.pricePerKg,
          s.totalAmount,
          s.amountReceived,
          s.outstandingPayment,
          s.paymentMethod,
          s.paymentStatus,
        ]);
        break;

      case 'orders':
        headers = ['Order ID', 'Order Date', 'Delivery Date', 'Customer', 'Phone', 'Variety', 'Qty (kg)', 'Total Value (INR)', 'Advance (INR)', 'Balance (INR)', 'Status'];
        rows = orders.map((o) => [
          o.id,
          o.orderDate,
          o.deliveryDate,
          `"${o.customerName}"`,
          o.customerPhone,
          `"${o.variety}"`,
          o.quantityKg,
          o.totalAmount,
          o.advancePayment,
          o.balancePayment,
          o.status,
        ]);
        break;

      case 'inventory':
        headers = ['Item ID', 'Category', 'Item Name', 'Unit', 'Harvested', 'Reserved', 'Sold', 'Spoiled', 'Available Stock', 'Location', 'Reorder Level'];
        rows = inventory.map((i) => [
          i.id,
          `"${i.category}"`,
          `"${i.name}"`,
          i.unit,
          i.harvestedStock,
          i.reservedStock,
          i.soldStock,
          i.spoiledStock,
          i.availableStock,
          `"${i.location || ''}"`,
          i.reorderLevel,
        ]);
        break;

      case 'expenses':
        headers = ['Expense ID', 'Date', 'Category', 'Description', 'Amount (INR)', 'Payment Method', 'Supplier', 'Receipt'];
        rows = expenses.map((e) => [
          e.id,
          e.date,
          `"${e.category}"`,
          `"${e.description.replace(/"/g, '""')}"`,
          e.amount,
          e.paymentMethod,
          `"${(e.supplier || '').replace(/"/g, '""')}"`,
          `"${(e.receiptNote || '').replace(/"/g, '""')}"`,
        ]);
        break;

      case 'customer-balances':
        headers = ['Customer ID', 'Customer Name', 'Phone', 'Address', 'Total Purchases (INR)', 'Orders Count', 'Outstanding Balance (INR)'];
        rows = customers.map((c) => [
          c.id,
          `"${c.name}"`,
          c.phone,
          `"${c.address.replace(/"/g, '""')}"`,
          c.totalPurchasesAmount,
          c.totalOrdersCount,
          c.outstandingBalance,
        ]);
        break;

      case 'profit-loss':
      case 'batch-profitability':
        headers = ['Metric / Batch ID', 'Variety / Description', 'Revenue (INR)', 'Cost (INR)', 'Profit (INR)', 'Margin %'];
        rows = batches.map((b) => [
          b.id,
          `"${b.variety}"`,
          b.saleableKg * 170,
          b.totalBatchCost,
          b.saleableKg * 170 - b.totalBatchCost,
          b.saleableKg > 0 ? Math.round(((b.saleableKg * 170 - b.totalBatchCost) / (b.saleableKg * 170)) * 100) : 0,
        ]);
        break;
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight">
            {t.navReports}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Export official production ledgers, customer ledger balances, sales registers, and P&L audit reports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs"
          >
            <Printer className="h-4 w-4 text-neutral-500" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <ArrowDownToLine className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection & Date Range Bar */}
      <div className="no-print rounded-xl border border-neutral-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'production', label: 'Production Batches' },
            { id: 'sales', label: 'Sales & Invoices' },
            { id: 'orders', label: 'Orders Lifecycle' },
            { id: 'inventory', label: 'Inventory & Supplies' },
            { id: 'expenses', label: 'Expenses Ledger' },
            { id: 'profit-loss', label: 'Profit & Loss Statement' },
            { id: 'customer-balances', label: 'Customer Balances' },
            { id: 'batch-profitability', label: 'Batch Profitability' },
          ].map((rep) => (
            <button
              key={rep.id}
              onClick={() => setReportType(rep.id as ReportType)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                reportType === rep.id
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {rep.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100 text-xs">
          <span className="font-semibold text-neutral-700">Audit Date Range:</span>
          <div className="flex items-center gap-2">
            <label className="text-neutral-500">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-neutral-200 p-1 font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-neutral-500">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-neutral-200 p-1 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Formatted Report Preview Container (Print-Ready) */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs text-xs font-sans">
        {/* Report Official Letterhead */}
        <div className="border-b border-neutral-200 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg font-bold text-neutral-900">{farmProfile.name}</h1>
              <p className="text-neutral-500 text-[11px]">{farmProfile.address}</p>
              <p className="text-neutral-500 text-[11px]">GSTIN: {farmProfile.gstin || '02AABCS1429K1ZX'} · Phone: {farmProfile.phone}</p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded bg-neutral-100 px-2.5 py-1 font-bold text-neutral-800 uppercase tracking-wide text-[11px]">
                {reportType.replace('-', ' ').toUpperCase()} AUDIT REPORT
              </span>
              <p className="text-[11px] text-neutral-400 font-mono mt-1">
                Generated: {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Table based on reportType */}
        <div className="overflow-x-auto">
          {reportType === 'production' && (
            <table className="w-full text-left">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                <tr>
                  <th className="p-2">Batch ID</th>
                  <th className="p-2">Variety</th>
                  <th className="p-2">Start Date</th>
                  <th className="p-2 text-right">Bags</th>
                  <th className="p-2 text-right">Substrate (kg)</th>
                  <th className="p-2 text-right">Batch Cost (₹)</th>
                  <th className="p-2 text-right">Yield (kg)</th>
                  <th className="p-2 text-right">Cost/kg (₹)</th>
                  <th className="p-2 text-right">B.E. %</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td className="p-2 font-bold text-neutral-900">{b.id}</td>
                    <td className="p-2 font-sans">{b.variety}</td>
                    <td className="p-2">{b.startDate}</td>
                    <td className="p-2 text-right">{b.bagCount}</td>
                    <td className="p-2 text-right">{b.substrateQuantityKg}</td>
                    <td className="p-2 text-right">{formatINR(b.totalBatchCost)}</td>
                    <td className="p-2 text-right text-emerald-800 font-bold">{formatKg(b.saleableKg)}</td>
                    <td className="p-2 text-right">{b.costPerKg > 0 ? formatINR(b.costPerKg) : '—'}</td>
                    <td className="p-2 text-right">{b.biologicalEfficiency}%</td>
                    <td className="p-2 font-sans font-semibold">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'sales' && (
            <table className="w-full text-left">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                <tr>
                  <th className="p-2">Invoice #</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Variety</th>
                  <th className="p-2 text-right">Quantity</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Total (₹)</th>
                  <th className="p-2 text-right">Received (₹)</th>
                  <th className="p-2 text-right">Balance Due (₹)</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="p-2 font-bold text-neutral-900">{s.id}</td>
                    <td className="p-2">{s.saleDate}</td>
                    <td className="p-2 font-sans">{s.customerName}</td>
                    <td className="p-2 font-sans">{s.variety}</td>
                    <td className="p-2 text-right font-bold text-neutral-900">{formatKg(s.quantityKg)}</td>
                    <td className="p-2 text-right">{formatINR(s.pricePerKg)}</td>
                    <td className="p-2 text-right font-bold text-neutral-900">{formatINR(s.totalAmount)}</td>
                    <td className="p-2 text-right text-emerald-700">{formatINR(s.amountReceived)}</td>
                    <td className="p-2 text-right text-amber-700">{formatINR(s.outstandingPayment)}</td>
                    <td className="p-2 font-sans font-semibold">{s.paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'orders' && (
            <table className="w-full text-left">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                <tr>
                  <th className="p-2">Order ID</th>
                  <th className="p-2">Order Date</th>
                  <th className="p-2">Delivery Date</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Variety</th>
                  <th className="p-2 text-right">Quantity</th>
                  <th className="p-2 text-right">Value (₹)</th>
                  <th className="p-2 text-right">Advance (₹)</th>
                  <th className="p-2 text-right">Balance (₹)</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="p-2 font-bold text-neutral-900">{o.id}</td>
                    <td className="p-2">{o.orderDate}</td>
                    <td className="p-2">{o.deliveryDate}</td>
                    <td className="p-2 font-sans">{o.customerName}</td>
                    <td className="p-2 font-sans">{o.variety}</td>
                    <td className="p-2 text-right font-bold">{formatKg(o.quantityKg)}</td>
                    <td className="p-2 text-right font-bold">{formatINR(o.totalAmount)}</td>
                    <td className="p-2 text-right text-emerald-700">{formatINR(o.advancePayment)}</td>
                    <td className="p-2 text-right text-amber-700">{formatINR(o.balancePayment)}</td>
                    <td className="p-2 font-sans font-semibold">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'inventory' && (
            <table className="w-full text-left">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                <tr>
                  <th className="p-2">Category</th>
                  <th className="p-2">Item Name</th>
                  <th className="p-2 text-right">Harvested / Recd</th>
                  <th className="p-2 text-right">Reserved</th>
                  <th className="p-2 text-right">Sold</th>
                  <th className="p-2 text-right">Spoiled</th>
                  <th className="p-2 text-right">Available Stock</th>
                  <th className="p-2">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {inventory.map((i) => (
                  <tr key={i.id}>
                    <td className="p-2 font-sans">{i.category}</td>
                    <td className="p-2 font-sans font-medium text-neutral-900">{i.name}</td>
                    <td className="p-2 text-right">{i.harvestedStock} {i.unit}</td>
                    <td className="p-2 text-right text-amber-700">{i.reservedStock} {i.unit}</td>
                    <td className="p-2 text-right">{i.soldStock} {i.unit}</td>
                    <td className="p-2 text-right text-rose-600">{i.spoiledStock} {i.unit}</td>
                    <td className="p-2 text-right font-bold text-emerald-800">{i.availableStock} {i.unit}</td>
                    <td className="p-2 font-sans text-neutral-500">{i.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'expenses' && (
            <table className="w-full text-left">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="p-2">{e.date}</td>
                    <td className="p-2 font-sans font-semibold text-neutral-900">{e.category}</td>
                    <td className="p-2 font-sans">{e.description}</td>
                    <td className="p-2 font-sans text-neutral-600">{e.supplier || '—'}</td>
                    <td className="p-2 font-sans">{e.paymentMethod}</td>
                    <td className="p-2 text-right font-bold text-neutral-900">{formatINR(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'customer-balances' && (
            <table className="w-full text-left">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                <tr>
                  <th className="p-2">Customer Name</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Address</th>
                  <th className="p-2 text-right">Orders</th>
                  <th className="p-2 text-right">Total Purchases (₹)</th>
                  <th className="p-2 text-right">Outstanding Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="p-2 font-sans font-bold text-neutral-900">{c.name}</td>
                    <td className="p-2">{c.phone}</td>
                    <td className="p-2 font-sans text-neutral-600">{c.address}</td>
                    <td className="p-2 text-right">{c.totalOrdersCount}</td>
                    <td className="p-2 text-right font-medium">{formatINR(c.totalPurchasesAmount)}</td>
                    <td className="p-2 text-right font-bold text-amber-700">{formatINR(c.outstandingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'profit-loss' && (
            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between font-bold border-b pb-2">
                <span>Recognized Revenue:</span>
                <span className="font-mono text-emerald-800">{formatINR(finances.totalRevenue)}</span>
              </div>
              <div className="flex justify-between font-semibold border-b pb-2">
                <span>Cost of Goods Sold (COGS):</span>
                <span className="font-mono text-neutral-800">- {formatINR(finances.cogs)}</span>
              </div>
              <div className="flex justify-between font-bold bg-neutral-50 p-2 rounded">
                <span>Gross Margin:</span>
                <span className="font-mono text-emerald-700">{formatINR(finances.grossProfit)}</span>
              </div>
              <div className="flex justify-between font-semibold border-b pb-2">
                <span>Total Operating Farm Expenses:</span>
                <span className="font-mono text-neutral-800">- {formatINR(finances.totalExpenses)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <span>Net Realized Profit:</span>
                <span className="font-mono text-emerald-900">{formatINR(finances.netProfit)}</span>
              </div>
            </div>
          )}

          {reportType === 'batch-profitability' && (
            <table className="w-full text-left">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                <tr>
                  <th className="p-2">Batch ID</th>
                  <th className="p-2">Variety</th>
                  <th className="p-2 text-right">Saleable Yield</th>
                  <th className="p-2 text-right">Batch Cost (₹)</th>
                  <th className="p-2 text-right">Est. Revenue (₹)</th>
                  <th className="p-2 text-right">Est. Profit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {batches.map((b) => {
                  const estRev = b.saleableKg * 170;
                  const profit = estRev - b.totalBatchCost;
                  return (
                    <tr key={b.id}>
                      <td className="p-2 font-bold text-neutral-900">{b.id}</td>
                      <td className="p-2 font-sans">{b.variety}</td>
                      <td className="p-2 text-right font-bold text-emerald-800">{formatKg(b.saleableKg)}</td>
                      <td className="p-2 text-right">{formatINR(b.totalBatchCost)}</td>
                      <td className="p-2 text-right">{formatINR(estRev)}</td>
                      <td className="p-2 text-right font-bold text-emerald-800">{formatINR(profit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
