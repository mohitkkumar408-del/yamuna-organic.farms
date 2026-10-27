import React, { useState, useMemo, useRef } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Printer,
  Download,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  CreditCard,
  QrCode,
  Building,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { Sale, PaymentMethod, PaymentStatus, MushroomVariety } from '../types';
import { formatINR, formatKg, calculateSaleInvoice } from '../utils/calculations';

export const SalesView: React.FC = () => {
  const {
    t,
    sales,
    inventory,
    farmProfile,
    createSale,
    recordPayment,
    deleteSale,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [varietyFilter, setVarietyFilter] = useState<string>('All');

  // Modals
  const [newSaleModalOpen, setNewSaleModalOpen] = useState(false);
  const [paymentModalSale, setPaymentModalSale] = useState<Sale | null>(null);
  const [invoicePrintModalSale, setInvoicePrintModalSale] = useState<Sale | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);

  // Direct Sale Form State
  const [saleForm, setSaleForm] = useState<{
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    variety: MushroomVariety;
    quantityKg: number;
    pricePerKg: number;
    discount: number;
    deliveryCharges: number;
    amountReceived: number;
    paymentMethod: PaymentMethod;
    notes: string;
  }>({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    variety: 'Oyster (Dhingri)',
    quantityKg: 5,
    pricePerKg: 160,
    discount: 0,
    deliveryCharges: 0,
    amountReceived: 800,
    paymentMethod: 'UPI',
    notes: 'Direct farm gate fresh harvest sale',
  });

  // Payment Recording State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethodSelect, setPaymentMethodSelect] = useState<PaymentMethod>('UPI');

  // Inventory available for selected variety
  const availableStockForForm = useMemo(() => {
    const item = inventory.find(
      (i) => i.category === 'Fresh Mushroom' && i.variety === saleForm.variety
    );
    return item?.availableStock || 0;
  }, [inventory, saleForm.variety]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesSearch =
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerPhone.includes(searchTerm) ||
        (s.orderId && s.orderId.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || s.paymentStatus === statusFilter;
      const matchesVariety = varietyFilter === 'All' || s.variety === varietyFilter;
      return matchesSearch && matchesStatus && matchesVariety;
    });
  }, [sales, searchTerm, statusFilter, varietyFilter]);

  // Summary KPIs
  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }, [sales]);

  const totalCollected = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.amountReceived) || 0), 0);
  }, [sales]);

  const totalOutstanding = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.outstandingPayment) || 0), 0);
  }, [sales]);

  const totalSoldKg = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.quantityKg) || 0), 0);
  }, [sales]);

  const avgSellingPrice = useMemo(() => {
    if (totalSoldKg === 0) return 0;
    return Math.round(totalRevenue / totalSoldKg);
  }, [totalRevenue, totalSoldKg]);

  const handleCreateSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError(null);

    const res = createSale({
      saleDate: new Date().toISOString().split('T')[0],
      customerName: saleForm.customerName,
      customerPhone: saleForm.customerPhone,
      customerAddress: saleForm.customerAddress,
      variety: saleForm.variety,
      quantityKg: Number(saleForm.quantityKg),
      pricePerKg: Number(saleForm.pricePerKg),
      discount: Number(saleForm.discount) || 0,
      deliveryCharges: Number(saleForm.deliveryCharges) || 0,
      amountReceived: Number(saleForm.amountReceived) || 0,
      paymentMethod: saleForm.paymentMethod,
      notes: saleForm.notes,
    });

    if (!res.success) {
      setSaleError(res.message || 'Could not record sale');
      return;
    }

    setNewSaleModalOpen(false);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSale) return;
    recordPayment(paymentModalSale.id, Number(paymentAmount), paymentMethodSelect);
    setPaymentModalSale(null);
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
            {t.navSales}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Generate GST-compliant invoices, track cash collections separately from revenue, and print receipts.
          </p>
        </div>

        <button
          onClick={() => {
            setSaleForm({
              customerName: '',
              customerPhone: '',
              customerAddress: '',
              variety: 'Oyster (Dhingri)',
              quantityKg: 5,
              pricePerKg: 160,
              discount: 0,
              deliveryCharges: 0,
              amountReceived: 800,
              paymentMethod: 'UPI',
              notes: 'Direct farm gate fresh harvest sale',
            });
            setSaleError(null);
            setNewSaleModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t.newSaleBtn}</span>
        </button>
      </div>

      {/* KPI Financial Collections Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Total Recognized Sales</span>
          <span className="text-xl font-bold font-mono tabular-nums text-neutral-900">
            {formatINR(totalRevenue)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">{sales.length} total invoices</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Actual Cash Collections</span>
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {formatINR(totalCollected)}
          </span>
          <span className="text-[11px] text-emerald-800 block mt-1">
            {totalRevenue > 0 ? `${Math.round((totalCollected / totalRevenue) * 100)}% collection rate` : '0%'}
          </span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Outstanding Receivables</span>
          <span className="text-xl font-bold font-mono tabular-nums text-amber-600">
            {formatINR(totalOutstanding)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">Customer balance due</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Average Selling Price</span>
          <span className="text-xl font-bold font-mono tabular-nums text-neutral-900">
            {formatINR(avgSellingPrice)}/kg
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">Across {formatKg(totalSoldKg)}</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, phone, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 pl-9 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="All">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          <select
            value={varietyFilter}
            onChange={(e) => setVarietyFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="All">All Varieties</option>
            <option value="Button (Agaricus)">Button (Agaricus)</option>
            <option value="Oyster (Dhingri)">Oyster (Dhingri)</option>
            <option value="Milky (Calocybe)">Milky (Calocybe)</option>
            <option value="Shiitake">Shiitake</option>
          </select>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{t.invoiceNumber}</th>
                <th className="py-3 px-3">{t.saleDate}</th>
                <th className="py-3 px-3">Customer Details</th>
                <th className="py-3 px-3">Mushroom Variety</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-3 text-right">Invoice Total</th>
                <th className="py-3 px-3 text-right">Received / Due</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  return (
                    <tr key={sale.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                        {sale.id}
                        {sale.orderId && (
                          <div className="text-[10px] text-neutral-400 font-normal">
                            Ref: {sale.orderId}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-600">
                        {sale.saleDate}
                      </td>
                      <td className="py-3 px-3 font-medium text-neutral-800">
                        {sale.customerName}
                        <div className="text-[11px] text-neutral-500 font-normal">
                          {sale.customerPhone}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-800">
                        {sale.variety}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-neutral-900">
                        {formatKg(sale.quantityKg)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {formatINR(sale.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                        <div className="text-emerald-700 font-medium">Rec: {formatINR(sale.amountReceived)}</div>
                        {sale.outstandingPayment > 0 && (
                          <div className="text-amber-700 font-semibold">Due: {formatINR(sale.outstandingPayment)}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-neutral-600">
                        {sale.paymentMethod}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold ${
                            sale.paymentStatus === 'Paid'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : sale.paymentStatus === 'Partial'
                              ? 'text-amber-700 bg-amber-50 border-amber-200'
                              : 'text-rose-700 bg-rose-50 border-rose-200'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {sale.paymentStatus !== 'Paid' && (
                            <button
                              onClick={() => {
                                setPaymentModalSale(sale);
                                setPaymentAmount(sale.outstandingPayment);
                                setPaymentMethodSelect('UPI');
                              }}
                              className="rounded bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                            >
                              + Pay
                            </button>
                          )}
                          <button
                            onClick={() => setInvoicePrintModalSale(sale)}
                            title="Print / PDF Invoice"
                            className="rounded border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-1"
                          >
                            <Printer className="h-3 w-3" />
                            Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-neutral-400">
                    No sales invoices found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Direct Sale Modal */}
      {newSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">{t.newSaleBtn}</h3>
              <button
                onClick={() => setNewSaleModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            {saleError && (
              <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {saleError}
              </div>
            )}

            <form onSubmit={handleCreateSaleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Customer / Buyer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hotel Green Park"
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98..."
                    value={saleForm.customerPhone}
                    onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Delivery / Mandi Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Azadpur Mandi, Delhi or Local Restaurant Kitchen"
                  value={saleForm.customerAddress}
                  onChange={(e) => setSaleForm({ ...saleForm, customerAddress: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-800">Mushroom Stock & Pricing</span>
                  <span className="text-[11px] text-neutral-600">
                    Available:{' '}
                    <strong className="text-emerald-800 font-mono">{formatKg(availableStockForForm)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Variety *</label>
                    <select
                      value={saleForm.variety}
                      onChange={(e) =>
                        setSaleForm({ ...saleForm, variety: e.target.value as MushroomVariety })
                      }
                      className="w-full rounded-lg border border-neutral-200 p-2 bg-white"
                    >
                      <option value="Oyster (Dhingri)">Oyster (Dhingri)</option>
                      <option value="Button (Agaricus)">Button (Agaricus)</option>
                      <option value="Milky (Calocybe)">Milky (Calocybe)</option>
                      <option value="Shiitake">Shiitake</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Qty (kg) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={saleForm.quantityKg}
                      onChange={(e) =>
                        setSaleForm({ ...saleForm, quantityKg: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-neutral-200 p-2 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Rate (₹/kg) *</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={saleForm.pricePerKg}
                      onChange={(e) =>
                        setSaleForm({ ...saleForm, pricePerKg: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-neutral-200 p-2 font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={saleForm.discount}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, discount: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Delivery Charges (₹)</label>
                  <input
                    type="number"
                    value={saleForm.deliveryCharges}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, deliveryCharges: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Payment Method</label>
                  <select
                    value={saleForm.paymentMethod}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, paymentMethod: e.target.value as PaymentMethod })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value="UPI">UPI (PhonePe/GPay)</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Amount Collected Now (₹)</label>
                <input
                  type="number"
                  value={saleForm.amountReceived}
                  onChange={(e) =>
                    setSaleForm({ ...saleForm, amountReceived: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-emerald-900">
                <span className="font-medium">Total Invoice Amount:</span>
                <span className="text-base font-bold font-mono">
                  {formatINR(
                    saleForm.quantityKg * saleForm.pricePerKg -
                      saleForm.discount +
                      saleForm.deliveryCharges
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewSaleModalOpen(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Confirm Sale & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900">
              Record Collection for {paymentModalSale.id}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Customer: {paymentModalSale.customerName} · Outstanding Due:{' '}
              <strong className="text-amber-700 font-mono">
                {formatINR(paymentModalSale.outstandingPayment)}
              </strong>
            </p>

            <form onSubmit={handleRecordPaymentSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  max={paymentModalSale.outstandingPayment}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethodSelect}
                  onChange={(e) => setPaymentMethodSelect(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalSale(null)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {invoicePrintModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            {/* Top Bar for Modal Actions (hidden on print) */}
            <div className="no-print flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <span className="text-xs font-medium text-neutral-500">Official Tax Invoice Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setInvoicePrintModalSale(null)}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="border border-neutral-200 rounded-xl p-6 bg-white text-neutral-900 text-xs font-sans">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-neutral-200 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                    {farmProfile.name}
                  </h2>
                  <p className="text-neutral-600 mt-1">{farmProfile.address}</p>
                  <p className="text-neutral-600">
                    Phone: {farmProfile.phone} · Email: {farmProfile.email}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-neutral-500">
                    <span>GSTIN: <strong>{farmProfile.gstin || '02AABCS1429K1ZX'}</strong></span>
                    <span>·</span>
                    <span>State: HP (02)</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    TAX INVOICE
                  </span>
                  <div className="mt-2 font-mono text-base font-bold text-neutral-900">
                    {invoicePrintModalSale.id}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1 font-mono">
                    Date: {invoicePrintModalSale.saleDate}
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-neutral-200">
                <div>
                  <span className="text-[11px] font-semibold text-neutral-500 block uppercase">Billed To (Customer):</span>
                  <p className="font-bold text-neutral-900 text-sm mt-0.5">{invoicePrintModalSale.customerName}</p>
                  <p className="text-neutral-600 mt-0.5">{invoicePrintModalSale.customerAddress || 'Direct Pickup'}</p>
                  <p className="text-neutral-600 font-mono mt-0.5">Phone: {invoicePrintModalSale.customerPhone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-neutral-500 block uppercase">Payment Details:</span>
                  <p className="font-semibold text-neutral-800 mt-0.5">Method: {invoicePrintModalSale.paymentMethod}</p>
                  <p className="text-[11px] text-neutral-500">Status: {invoicePrintModalSale.paymentStatus}</p>
                  <p className="text-[11px] font-mono text-emerald-800 font-semibold mt-1">UPI: {farmProfile.upiId}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4">
                <table className="w-full text-left">
                  <thead className="border-b border-neutral-200 text-neutral-600 font-semibold text-[11px] uppercase">
                    <tr>
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-right">HSN/SAC</th>
                      <th className="pb-2 text-right">Quantity</th>
                      <th className="pb-2 text-right">Rate (₹)</th>
                      <th className="pb-2 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    <tr>
                      <td className="py-3 font-medium text-neutral-900">
                        Fresh Farm Mushrooms - {invoicePrintModalSale.variety}
                        <div className="text-[10px] text-neutral-400">Packed in food-grade ventilated cartons/punnets</div>
                      </td>
                      <td className="py-3 text-right font-mono text-neutral-500">07095900</td>
                      <td className="py-3 text-right font-mono font-semibold">{formatKg(invoicePrintModalSale.quantityKg)}</td>
                      <td className="py-3 text-right font-mono">{formatINR(invoicePrintModalSale.pricePerKg)}</td>
                      <td className="py-3 text-right font-mono font-bold text-neutral-900">
                        {formatINR(invoicePrintModalSale.quantityKg * invoicePrintModalSale.pricePerKg)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Calculations Footer */}
              <div className="border-t border-neutral-200 pt-3 grid grid-cols-2 gap-4">
                <div className="text-[11px] text-neutral-500 space-y-1">
                  <p><strong>Terms:</strong> Fresh perishable produce once verified at delivery is non-returnable.</p>
                  <p>Payment due immediately upon receipt.</p>
                </div>

                <div className="space-y-1 text-right text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Subtotal:</span>
                    <span className="font-mono">{formatINR(invoicePrintModalSale.quantityKg * invoicePrintModalSale.pricePerKg)}</span>
                  </div>
                  {invoicePrintModalSale.discount > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Discount:</span>
                      <span className="font-mono text-rose-600">- {formatINR(invoicePrintModalSale.discount)}</span>
                    </div>
                  )}
                  {invoicePrintModalSale.deliveryCharges > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Delivery / Freight:</span>
                      <span className="font-mono">{formatINR(invoicePrintModalSale.deliveryCharges)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold text-base text-neutral-900">
                    <span>Total Invoice:</span>
                    <span className="font-mono text-emerald-800">{formatINR(invoicePrintModalSale.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Amount Received:</span>
                    <span className="font-mono">{formatINR(invoicePrintModalSale.amountReceived)}</span>
                  </div>
                  {invoicePrintModalSale.outstandingPayment > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold border-t border-neutral-100 pt-1">
                      <span>Balance Outstanding:</span>
                      <span className="font-mono">{formatINR(invoicePrintModalSale.outstandingPayment)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature */}
              <div className="mt-8 flex justify-between items-end text-neutral-500 text-[11px] pt-4 border-t border-neutral-100">
                <div>
                  <p>Generated via Mushroom Farm Manager System</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-900">For {farmProfile.name}</p>
                  <p className="mt-6 border-t border-neutral-300 pt-1">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
