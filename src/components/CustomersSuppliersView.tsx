import React, { useState, useMemo } from 'react';
import {
  Users,
  Building,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  ShoppingCart,
  MessageSquare,
  X,
  FileText,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { Customer, Supplier } from '../types';
import { formatINR } from '../utils/calculations';

export const CustomersSuppliersView: React.FC = () => {
  const {
    t,
    customers,
    suppliers,
    sales,
    orders,
    expenses,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newSupplierModalOpen, setNewSupplierModalOpen] = useState(false);
  const [viewCustomerHistory, setViewCustomerHistory] = useState<Customer | null>(null);
  const [viewSupplierHistory, setViewSupplierHistory] = useState<Supplier | null>(null);

  // Customer Form
  const [customerForm, setCustomerForm] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
  }>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // Supplier Form
  const [supplierForm, setSupplierForm] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
    productsSupplied: string;
  }>({
    name: '',
    phone: '',
    email: '',
    address: '',
    productsSupplied: 'Wheat Straw / Master Grain Spawn',
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm) ||
        (s.productsSupplied && s.productsSupplied.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [suppliers, searchTerm]);

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer(customerForm);
    setNewCustomerModalOpen(false);
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSupplier(supplierForm);
    setNewSupplierModalOpen(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight">
            {t.navContacts}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Directory of hotel chefs, Mandi traders, organic retail buyers, and farm input suppliers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'customers' ? (
            <button
              onClick={() => {
                setCustomerForm({ name: '', phone: '', email: '', address: '' });
                setNewCustomerModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>{t.newCustomerBtn}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSupplierForm({
                  name: '',
                  phone: '',
                  email: '',
                  address: '',
                  productsSupplied: 'Wheat Straw / Master Grain Spawn',
                });
                setNewSupplierModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>{t.newSupplierBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'customers'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>{t.customers} ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>{t.suppliers} ({suppliers.length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder={activeTab === 'customers' ? 'Search customers by name, phone...' : 'Search suppliers by products...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 pl-9 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Content for Customers Tab */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
            return (
              <div
                key={cust.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm">{cust.name}</h3>
                      <span className="font-mono text-[10px] text-neutral-400">{cust.id}</span>
                    </div>
                    {cust.outstandingBalance > 0 ? (
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200 font-mono">
                        Due: {formatINR(cust.outstandingBalance)}
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                        Clear Balance
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span className="font-mono">{cust.phone}</span>
                    </div>
                    {cust.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <span className="text-neutral-500 text-[11px] leading-tight line-clamp-2">
                        {cust.address}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Total Purchases</span>
                      <span className="font-mono font-bold text-neutral-900">
                        {formatINR(cust.totalPurchasesAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Orders Placed</span>
                      <span className="font-mono font-bold text-neutral-900">
                        {cust.totalOrdersCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="rounded border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-100"
                      title="Call"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-emerald-200 p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      title="WhatsApp Chat"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={() => setViewCustomerHistory(cust)}
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    Order History →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content for Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => {
            return (
              <div
                key={sup.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm">{sup.name}</h3>
                      <span className="font-mono text-[10px] text-neutral-400">{sup.id}</span>
                    </div>
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                      Input Vendor
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span className="font-mono">{sup.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <span className="text-neutral-500 text-[11px] leading-tight line-clamp-2">
                        {sup.address}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-neutral-50 p-2.5 text-xs">
                    <span className="font-semibold text-neutral-700 block mb-0.5">Supplies Provided:</span>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">{sup.productsSupplied}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Total Farm Procurement</span>
                      <span className="font-mono font-bold text-neutral-900">
                        {formatINR(sup.totalPurchasesAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
                  <button
                    onClick={() => setViewSupplierHistory(sup)}
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    Purchase History →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      {newCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900">{t.newCustomerBtn}</h3>
            <form onSubmit={handleAddCustomerSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Customer / Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hotel Mountain View"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98..."
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="chef@hotel.com"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Delivery / Mandi Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Street, locality, city and pincode"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCustomerModalOpen(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {newSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900">{t.newSupplierBtn}</h3>
            <form onSubmit={handleAddSupplierSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kisan Bio Spawn Laboratory"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 ..."
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Address</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Materials / Inputs Supplied *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grain Spawn, Wheat Straw, Autoclavable PP Bags"
                  value={supplierForm.productsSupplied}
                  onChange={(e) =>
                    setSupplierForm({ ...supplierForm, productsSupplied: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewSupplierModalOpen(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Transaction History Modal */}
      {viewCustomerHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">{viewCustomerHistory.name}</h3>
                <p className="text-xs text-neutral-500 font-mono">{viewCustomerHistory.phone}</p>
              </div>
              <button
                onClick={() => setViewCustomerHistory(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-neutral-50 p-3">
                <div>
                  <span className="text-neutral-500 block">Total Lifetime Purchases:</span>
                  <span className="font-mono font-bold text-sm text-neutral-900">
                    {formatINR(viewCustomerHistory.totalPurchasesAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Current Balance Outstanding:</span>
                  <span className="font-mono font-bold text-sm text-amber-700">
                    {formatINR(viewCustomerHistory.outstandingBalance)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900 text-sm mb-2">Orders & Sales History</h4>
                {orders.filter((o) => o.customerName === viewCustomerHistory.name).length > 0 ? (
                  <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg">
                    {orders
                      .filter((o) => o.customerName === viewCustomerHistory.name)
                      .map((ord) => (
                        <div key={ord.id} className="p-3 flex justify-between items-center">
                          <div>
                            <span className="font-mono font-bold text-neutral-900">{ord.id}</span>
                            <span className="text-neutral-400 ml-2">({ord.orderDate})</span>
                            <div className="text-neutral-600 mt-0.5">
                              {ord.variety} · {ord.quantityKg} kg
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-semibold text-emerald-800">
                              {formatINR(ord.totalAmount)}
                            </span>
                            <div className="text-[10px] text-neutral-500 font-medium">
                              Status: {ord.status}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-neutral-400 italic">No orders recorded for this customer yet.</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewCustomerHistory(null)}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Transaction History Modal */}
      {viewSupplierHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">{viewSupplierHistory.name}</h3>
                <p className="text-xs text-neutral-500 font-mono">{viewSupplierHistory.phone}</p>
              </div>
              <button
                onClick={() => setViewSupplierHistory(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-neutral-50 p-3">
                <span className="text-neutral-500 block">Total Supplies Procured:</span>
                <span className="font-mono font-bold text-base text-neutral-900">
                  {formatINR(viewSupplierHistory.totalPurchasesAmount)}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900 text-sm mb-2">Procurement Expense Entries</h4>
                {expenses.filter(
                  (e) => e.supplier && e.supplier.toLowerCase().includes(viewSupplierHistory.name.toLowerCase().split(' ')[0])
                ).length > 0 ? (
                  <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg">
                    {expenses
                      .filter(
                        (e) =>
                          e.supplier &&
                          e.supplier.toLowerCase().includes(viewSupplierHistory.name.toLowerCase().split(' ')[0])
                      )
                      .map((exp) => (
                        <div key={exp.id} className="p-3 flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-neutral-900">{exp.category}</span>
                            <span className="text-neutral-400 font-mono ml-2">({exp.date})</span>
                            <div className="text-neutral-600 mt-0.5">{exp.description}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-neutral-900">
                              {formatINR(exp.amount)}
                            </span>
                            <div className="text-[10px] text-neutral-500 font-medium">
                              {exp.paymentMethod}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-neutral-400 italic">No direct expense vouchers logged under this supplier name.</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewSupplierHistory(null)}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
