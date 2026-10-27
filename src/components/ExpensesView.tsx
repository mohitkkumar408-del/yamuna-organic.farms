import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  Layers,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { formatINR } from '../utils/calculations';

export const ExpensesView: React.FC = () => {
  const { t, expenses, suppliers, addExpense, deleteExpense } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'month' | 'week'>('all');

  // Modal
  const [newExpenseModalOpen, setNewExpenseModalOpen] = useState(false);

  // Form State
  const [expenseForm, setExpenseForm] = useState<{
    date: string;
    category: ExpenseCategory | string;
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    supplier: string;
    receiptNote: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    category: 'Mushroom Spawn',
    description: '',
    amount: 1500,
    paymentMethod: 'UPI',
    supplier: '',
    receiptNote: '',
  });

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const matchesSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.supplier && e.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.receiptNote && e.receiptNote.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        categoryFilter === 'All' || e.category === categoryFilter;

      // Time filter
      let matchesTime = true;
      if (timeFilter !== 'all') {
        const expDate = new Date(e.date);
        if (timeFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesTime = expDate >= weekAgo;
        } else if (timeFilter === 'month') {
          matchesTime =
            expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'year') {
          matchesTime = expDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesCategory && matchesTime;
    });
  }, [expenses, searchTerm, categoryFilter, timeFilter]);

  // Aggregate Stats
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // Category breakdown
  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const handleCreateExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      date: expenseForm.date,
      category: expenseForm.category,
      description: expenseForm.description,
      amount: Number(expenseForm.amount),
      paymentMethod: expenseForm.paymentMethod,
      supplier: expenseForm.supplier,
      receiptNote: expenseForm.receiptNote,
    });
    setNewExpenseModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Expense ID', 'Date', 'Category', 'Description', 'Amount (INR)', 'Payment Method', 'Supplier', 'Receipt Note'];
    const rows = filteredExpenses.map((e) => [
      e.id,
      e.date,
      `"${e.category}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      e.paymentMethod,
      `"${(e.supplier || '').replace(/"/g, '""')}"`,
      `"${(e.receiptNote || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Mushroom_Farm_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight">
            {t.navExpenses}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Detailed operational cost ledger: spawn, straw, compost, labour, electricity, and packaging.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setExpenseForm({
                date: new Date().toISOString().split('T')[0],
                category: 'Mushroom Spawn',
                description: '',
                amount: 1500,
                paymentMethod: 'UPI',
                supplier: suppliers[0]?.name || '',
                receiptNote: '',
              });
              setNewExpenseModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>{t.newExpenseBtn}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Total Filtered Expenses</span>
          <span className="text-xl font-bold font-mono tabular-nums text-neutral-900">
            {formatINR(totalAmount)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">{filteredExpenses.length} entries</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Top Expense Category</span>
          <span className="text-base font-bold text-emerald-800 truncate block">
            {categorySummary[0] ? categorySummary[0][0] : 'None'}
          </span>
          <span className="text-[11px] text-neutral-400 font-mono block mt-1">
            {categorySummary[0] ? formatINR(categorySummary[0][1]) : '—'}
          </span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Active Suppliers Count</span>
          <span className="text-xl font-bold font-mono tabular-nums text-neutral-900">
            {suppliers.length} vendors
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">Verified partner accounts</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Accounting Allocation</span>
          <span className="text-xs font-semibold text-neutral-800 block mt-1">
            Matching Principle
          </span>
          <span className="text-[11px] text-neutral-400 block">Separates direct batch costs from general farm overhead</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search description, supplier, category, bill voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 pl-9 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="All">All Categories</option>
            <option value="Mushroom Spawn">Mushroom Spawn</option>
            <option value="Straw & Substrate">Straw & Substrate</option>
            <option value="Compost">Compost</option>
            <option value="Bags & Packaging">Bags & Packaging</option>
            <option value="Labour">Labour</option>
            <option value="Electricity">Electricity</option>
            <option value="Water">Water</option>
            <option value="Rent">Rent</option>
            <option value="Transportation">Transportation</option>
            <option value="Equipment">Equipment</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Marketing">Marketing</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Expense Category</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Supplier / Vendor</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => {
                  return (
                    <tr key={exp.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-neutral-600 font-medium">
                        {exp.date}
                        <div className="text-[10px] text-neutral-400 font-mono">{exp.id}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-900">
                        {exp.category}
                      </td>
                      <td className="py-3 px-3 text-neutral-800 max-w-xs">
                        {exp.description}
                        {exp.receiptNote && (
                          <div className="text-[11px] text-neutral-400 font-normal">
                            Receipt: {exp.receiptNote}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-neutral-600">
                        {exp.supplier || '—'}
                      </td>
                      <td className="py-3 px-3 text-neutral-600">
                        {exp.paymentMethod}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-neutral-900 text-sm">
                        {formatINR(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Delete expense record ${exp.id}?`)) {
                              deleteExpense(exp.id);
                            }
                          }}
                          className="rounded p-1 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-neutral-400">
                    No expense entries found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Expense Modal */}
      {newExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">{t.newExpenseBtn}</h3>
              <button
                onClick={() => setNewExpenseModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpenseSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.category} *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value="Mushroom Spawn">Mushroom Spawn</option>
                    <option value="Straw & Substrate">Straw & Substrate</option>
                    <option value="Compost">Compost</option>
                    <option value="Bags & Packaging">Bags & Packaging</option>
                    <option value="Labour">Labour</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Rent">Rent</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">{t.description} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500 kg Wheat straw loaded from local farmer"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.amount} *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as PaymentMethod })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Supplier / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. DMR Solan or Local Vendor"
                    value={expenseForm.supplier}
                    onChange={(e) => setExpenseForm({ ...expenseForm, supplier: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Receipt / Voucher #</label>
                  <input
                    type="text"
                    placeholder="e.g. Challan #1049"
                    value={expenseForm.receiptNote}
                    onChange={(e) => setExpenseForm({ ...expenseForm, receiptNote: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewExpenseModalOpen(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
