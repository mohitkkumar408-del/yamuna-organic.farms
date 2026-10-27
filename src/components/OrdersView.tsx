import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { Order, OrderStatus, MushroomVariety } from '../types';
import { formatINR, formatKg } from '../utils/calculations';

export const OrdersView: React.FC<{ onNavigateToSales?: () => void }> = ({ onNavigateToSales }) => {
  const {
    t,
    orders,
    inventory,
    customers,
    createOrder,
    updateOrderStatus,
    deleteOrder,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [varietyFilter, setVarietyFilter] = useState<string>('All');

  // Modals
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Order Form State
  const [formData, setFormData] = useState<{
    customerId: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    orderDate: string;
    deliveryDate: string;
    variety: MushroomVariety;
    quantityKg: number;
    pricePerKg: number;
    advancePayment: number;
    notes: string;
    status: OrderStatus;
  }>({
    customerId: '',
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    variety: 'Button (Agaricus)',
    quantityKg: 10,
    pricePerKg: 220,
    advancePayment: 1000,
    notes: 'Standard 200g punnet trays packing with ventilation',
    status: 'Confirmed',
  });

  // Check available stock for selected variety in form
  const currentAvailableStock = useMemo(() => {
    const item = inventory.find(
      (i) => i.category === 'Fresh Mushroom' && i.variety === formData.variety
    );
    return item?.availableStock || 0;
  }, [inventory, formData.variety]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm) ||
        (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      const matchesVariety = varietyFilter === 'All' || order.variety === varietyFilter;
      return matchesSearch && matchesStatus && matchesVariety;
    });
  }, [orders, searchTerm, statusFilter, varietyFilter]);

  // Order Counts
  const counts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let pending = 0;
    let processing = 0;
    let ready = 0;
    let dispatched = 0;
    let completed = 0;
    let cancelled = 0;
    let overdue = 0;

    orders.forEach((o) => {
      if (o.status === 'New' || o.status === 'Confirmed') pending++;
      else if (o.status === 'Processing') processing++;
      else if (o.status === 'Ready for Dispatch') ready++;
      else if (o.status === 'Dispatched') dispatched++;
      else if (o.status === 'Completed') completed++;
      else if (o.status === 'Cancelled') cancelled++;

      if (o.status !== 'Completed' && o.status !== 'Cancelled' && o.deliveryDate < today) {
        overdue++;
      }
    });

    return {
      total: orders.length,
      pending,
      processing,
      ready,
      dispatched,
      completed,
      cancelled,
      overdue,
    };
  }, [orders]);

  const handleCustomerSelect = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        deliveryAddress: cust.address,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
      }));
    }
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const totalAmount = formData.quantityKg * formData.pricePerKg;
    const balancePayment = Math.max(0, totalAmount - formData.advancePayment);

    const res = createOrder({
      customerId: formData.customerId || `CUST-WALK-${Date.now().toString().slice(-4)}`,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      deliveryAddress: formData.deliveryAddress,
      orderDate: formData.orderDate,
      deliveryDate: formData.deliveryDate,
      variety: formData.variety,
      quantityKg: Number(formData.quantityKg),
      pricePerKg: Number(formData.pricePerKg),
      totalAmount,
      advancePayment: Number(formData.advancePayment) || 0,
      balancePayment,
      notes: formData.notes,
      status: formData.status,
    });

    if (!res.success) {
      setErrorMessage(res.message || 'Error creating order.');
      return;
    }

    setNewOrderModalOpen(false);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const res = updateOrderStatus(orderId, newStatus);
    if (!res.success) {
      alert(res.message || 'Could not update status');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'New':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Confirmed':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Processing':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'Ready for Dispatch':
        return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'Dispatched':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'Completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Cancelled':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight">
            {t.navOrders}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Complete lifecycle: Stock reservation upon confirmation, automated fulfillment, balance tracking.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              customerId: customers[0]?.id || '',
              customerName: customers[0]?.name || '',
              customerPhone: customers[0]?.phone || '',
              deliveryAddress: customers[0]?.address || '',
              orderDate: new Date().toISOString().split('T')[0],
              deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              variety: 'Button (Agaricus)',
              quantityKg: 10,
              pricePerKg: 220,
              advancePayment: 1000,
              notes: 'Standard 200g punnet trays packing with ventilation',
              status: 'Confirmed',
            });
            setErrorMessage(null);
            setNewOrderModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t.newOrderBtn}</span>
        </button>
      </div>

      {/* KPI Order Status Ribbon (8 Metrics) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <span className="text-[11px] text-neutral-500 block">Total Orders</span>
          <span className="text-lg font-bold font-mono text-neutral-900">{counts.total}</span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <span className="text-[11px] text-neutral-500 block">Pending / New</span>
          <span className="text-lg font-bold font-mono text-blue-600">{counts.pending}</span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <span className="text-[11px] text-neutral-500 block">In Processing</span>
          <span className="text-lg font-bold font-mono text-purple-600">{counts.processing}</span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <span className="text-[11px] text-neutral-500 block">Ready to Dispatch</span>
          <span className="text-lg font-bold font-mono text-teal-600">{counts.ready}</span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <span className="text-[11px] text-neutral-500 block">Dispatched</span>
          <span className="text-lg font-bold font-mono text-indigo-600">{counts.dispatched}</span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <span className="text-[11px] text-neutral-500 block">Completed</span>
          <span className="text-lg font-bold font-mono text-emerald-700">{counts.completed}</span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <span className="text-[11px] text-neutral-500 block">Cancelled</span>
          <span className="text-lg font-bold font-mono text-rose-600">{counts.cancelled}</span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <span className="text-[11px] text-neutral-500 block">Overdue</span>
          <span className="text-lg font-bold font-mono text-amber-600">{counts.overdue}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by Order ID, customer, phone, location..."
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
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Ready for Dispatch">Ready for Dispatch</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
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

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{t.orderId}</th>
                <th className="py-3 px-3">Customer & Delivery</th>
                <th className="py-3 px-3">Variety & Qty</th>
                <th className="py-3 px-3 text-right">Value (₹)</th>
                <th className="py-3 px-3 text-right">Advance / Balance</th>
                <th className="py-3 px-3">Delivery Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Manage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                        {order.id}
                        {order.saleInvoiceId && (
                          <div className="text-[10px] text-emerald-700 font-mono">
                            Inv: {order.saleInvoiceId}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-neutral-800">
                        {order.customerName}
                        <div className="text-[11px] text-neutral-500 font-normal">
                          {order.customerPhone} · {order.deliveryAddress?.slice(0, 25)}...
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-800">
                        <span className="font-semibold text-emerald-900">{formatKg(order.quantityKg)}</span>
                        <div className="text-[11px] text-neutral-500">
                          {order.variety} @ {formatINR(order.pricePerKg)}/kg
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {formatINR(order.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                        <div className="text-emerald-700 font-medium">Adv: {formatINR(order.advancePayment)}</div>
                        <div className="text-amber-700 font-medium">Due: {formatINR(order.balancePayment)}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-600">
                        {order.deliveryDate}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        {order.stockReserved && (
                          <span className="block text-[10px] text-amber-600">Stock Reserved</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {order.status === 'New' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'Confirmed')}
                              className="rounded bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              Confirm
                            </button>
                          )}
                          {order.status === 'Confirmed' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'Processing')}
                              className="rounded bg-purple-50 border border-purple-200 px-2 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100"
                            >
                              Pack / Process
                            </button>
                          )}
                          {order.status === 'Processing' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'Ready for Dispatch')}
                              className="rounded bg-teal-50 border border-teal-200 px-2 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-100"
                            >
                              Ready
                            </button>
                          )}
                          {order.status === 'Ready for Dispatch' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'Dispatched')}
                              className="rounded bg-indigo-50 border border-indigo-200 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                              Dispatch
                            </button>
                          )}
                          {order.status === 'Dispatched' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'Completed')}
                              title="Marks delivered, deducts stock once, creates invoice"
                              className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                            >
                              Fulfill & Bill
                            </button>
                          )}
                          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                            <button
                              onClick={() => {
                                if (confirm(`Cancel order ${order.id}? Any reserved stock will be released.`)) {
                                  handleStatusChange(order.id, 'Cancelled');
                                }
                              }}
                              className="rounded border border-neutral-200 px-1.5 py-1 text-[11px] text-neutral-500 hover:text-rose-600 hover:bg-neutral-50"
                              title="Cancel Order"
                            >
                              ✕
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrderDetails(order)}
                            className="rounded border border-neutral-200 px-2 py-1 text-[11px] text-neutral-700 hover:bg-neutral-100"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-neutral-400">
                    No orders found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {newOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">{t.newOrderBtn}</h3>
              <button
                onClick={() => setNewOrderModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrderSubmit} className="mt-4 space-y-4 text-xs">
              {/* Customer Selector */}
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Existing Customer or New Buyer
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                >
                  <option value="">— Enter Custom / Walk-in Customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - Orders: {c.totalOrdersCount}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.customerName} *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.customerPhone} *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">{t.deliveryAddress} *</label>
                <input
                  type="text"
                  required
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Order Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.deliveryDate} *</label>
                  <input
                    type="date"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
              </div>

              {/* Variety & Stock Validation */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800">Mushroom Order Item</span>
                  <span className="text-[11px] text-neutral-600">
                    Cold storage available:{' '}
                    <strong className="text-emerald-800 font-mono">{formatKg(currentAvailableStock)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">{t.variety} *</label>
                    <select
                      value={formData.variety}
                      onChange={(e) =>
                        setFormData({ ...formData, variety: e.target.value as MushroomVariety })
                      }
                      className="w-full rounded-lg border border-neutral-200 p-2 bg-white"
                    >
                      <option value="Button (Agaricus)">Button (Agaricus)</option>
                      <option value="Oyster (Dhingri)">Oyster (Dhingri)</option>
                      <option value="Milky (Calocybe)">Milky (Calocybe)</option>
                      <option value="Shiitake">Shiitake</option>
                      <option value="King Oyster">King Oyster</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Quantity (kg) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={formData.quantityKg}
                      onChange={(e) =>
                        setFormData({ ...formData, quantityKg: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-neutral-200 p-2 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Price per kg (₹) *</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={formData.pricePerKg}
                      onChange={(e) =>
                        setFormData({ ...formData, pricePerKg: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-neutral-200 p-2 font-mono bg-white"
                    />
                  </div>
                </div>

                {formData.quantityKg > currentAvailableStock && (
                  <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Notice: Order qty exceeds current available stock. Stock must be harvested before confirmation.
                  </div>
                )}
              </div>

              {/* Payment Advance & Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as OrderStatus })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value="Confirmed">Confirmed (Reserves Stock)</option>
                    <option value="New">New (Draft / Unreserved)</option>
                    <option value="Processing">Processing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.advancePaid}</label>
                  <input
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) =>
                      setFormData({ ...formData, advancePayment: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Total Order Value</label>
                  <div className="p-2 rounded-lg bg-neutral-100 font-mono font-bold text-neutral-900">
                    {formatINR(formData.quantityKg * formData.pricePerKg)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Packaging & Delivery Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Early morning delivery required before 8 AM"
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewOrderModalOpen(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Create & Book Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 font-mono">
                  {selectedOrderDetails.id}
                </h3>
                <span
                  className={`inline-block mt-1 rounded border px-2 py-0.5 text-[11px] font-semibold ${getStatusBadge(
                    selectedOrderDetails.status
                  )}`}
                >
                  {selectedOrderDetails.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Customer:</span>
                  <span className="font-semibold text-neutral-900">{selectedOrderDetails.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Contact:</span>
                  <span className="font-mono text-neutral-900">{selectedOrderDetails.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Address:</span>
                  <span className="text-right text-neutral-800">{selectedOrderDetails.deliveryAddress}</span>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Ordered Variety:</span>
                  <span className="font-semibold text-neutral-900">{selectedOrderDetails.variety}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Quantity:</span>
                  <span className="font-mono font-bold text-neutral-900">{formatKg(selectedOrderDetails.quantityKg)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Unit Price:</span>
                  <span className="font-mono text-neutral-900">{formatINR(selectedOrderDetails.pricePerKg)}/kg</span>
                </div>
                <div className="flex justify-between border-t border-neutral-100 pt-2 font-bold text-sm">
                  <span>Total Order Value:</span>
                  <span className="font-mono text-emerald-800">{formatINR(selectedOrderDetails.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Advance Received:</span>
                  <span className="font-mono text-emerald-700">{formatINR(selectedOrderDetails.advancePayment)}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Balance Payable:</span>
                  <span className="font-mono">{formatINR(selectedOrderDetails.balancePayment)}</span>
                </div>
              </div>

              {selectedOrderDetails.notes && (
                <div className="p-2 rounded bg-neutral-50 border border-neutral-100 text-neutral-600">
                  <strong>Notes:</strong> {selectedOrderDetails.notes}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
                <button
                  onClick={() => {
                    if (confirm(`Delete order ${selectedOrderDetails.id}?`)) {
                      deleteOrder(selectedOrderDetails.id);
                      setSelectedOrderDetails(null);
                    }
                  }}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Delete Order
                </button>

                <div className="flex gap-2">
                  {selectedOrderDetails.status === 'Completed' && onNavigateToSales && (
                    <button
                      onClick={() => {
                        setSelectedOrderDetails(null);
                        onNavigateToSales();
                      }}
                      className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
                    >
                      View Generated Invoice →
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrderDetails(null)}
                    className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
