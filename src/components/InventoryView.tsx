import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { InventoryItem, InventoryCategory, MushroomVariety } from '../types';
import { formatINR, formatKg } from '../utils/calculations';

export const InventoryView: React.FC = () => {
  const {
    t,
    inventory,
    addInventoryItem,
    updateInventoryItem,
    logSpoilage,
    adjustStock,
  } = useFarm();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [spoilageModalItem, setSpoilageModalItem] = useState<InventoryItem | null>(null);
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryItem | null>(null);

  // New Item State
  const [newItemData, setNewItemData] = useState<{
    category: InventoryCategory;
    name: string;
    variety: MushroomVariety;
    unit: 'kg' | 'units' | 'rolls' | 'packets';
    harvestedStock: number;
    reorderLevel: number;
    unitCost: number;
    location: string;
    expiryDate: string;
  }>({
    category: 'Fresh Mushroom',
    name: '',
    variety: 'Oyster (Dhingri)',
    unit: 'kg',
    harvestedStock: 0,
    reorderLevel: 10,
    unitCost: 80,
    location: 'Cold Room 1',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Spoilage State
  const [spoilageAmount, setSpoilageAmount] = useState<number>(1);
  const [spoilageReason, setSpoilageReason] = useState<string>('Cap browning / excessive moisture');

  // Adjust State
  const [adjustedAvailable, setAdjustedAvailable] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Physical weigh-scale recount audit');

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchesCategory =
        activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.variety && item.variety.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [inventory, activeCategory, searchTerm]);

  // Overall totals
  const totalFreshAvailable = useMemo(() => {
    return inventory
      .filter((i) => i.category === 'Fresh Mushroom')
      .reduce((sum, i) => sum + (Number(i.availableStock) || 0), 0);
  }, [inventory]);

  const totalFreshReserved = useMemo(() => {
    return inventory
      .filter((i) => i.category === 'Fresh Mushroom')
      .reduce((sum, i) => sum + (Number(i.reservedStock) || 0), 0);
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter((i) => i.availableStock <= i.reorderLevel).length;
  }, [inventory]);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryItem({
      category: newItemData.category,
      name: newItemData.name || (newItemData.category === 'Fresh Mushroom' ? `Fresh ${newItemData.variety}` : 'New Supply Item'),
      variety: newItemData.category === 'Fresh Mushroom' ? newItemData.variety : undefined,
      unit: newItemData.unit,
      harvestedStock: Number(newItemData.harvestedStock) || 0,
      reservedStock: 0,
      soldStock: 0,
      spoiledStock: 0,
      reorderLevel: Number(newItemData.reorderLevel) || 0,
      unitCost: Number(newItemData.unitCost) || 0,
      location: newItemData.location,
      expiryDate: newItemData.expiryDate,
    });
    setAddItemModalOpen(false);
  };

  const handleSpoilageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spoilageModalItem) return;
    logSpoilage(spoilageModalItem.id, Number(spoilageAmount), spoilageReason);
    setSpoilageModalItem(null);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;
    adjustStock(adjustModalItem.id, Number(adjustedAvailable), adjustReason);
    setAdjustModalItem(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight">
            {t.navInventory}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time stock balance, order reservations, packaging supplies, and shelf-life tracking.
          </p>
        </div>

        <button
          onClick={() => {
            setNewItemData({
              category: 'Fresh Mushroom',
              name: '',
              variety: 'Oyster (Dhingri)',
              unit: 'kg',
              harvestedStock: 10,
              reorderLevel: 10,
              unitCost: 80,
              location: 'Cold Storage Room 1',
              expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });
            setAddItemModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Stock / Supply Item</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Total Available Fresh Stock</span>
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-800">
            {formatKg(totalFreshAvailable)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">Ready for sale dispatch</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Reserved for Confirmed Orders</span>
          <span className="text-xl font-bold font-mono tabular-nums text-amber-600">
            {formatKg(totalFreshReserved)}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">Locked in orders</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Low-Stock Warnings</span>
          <span className="text-xl font-bold font-mono tabular-nums text-rose-600">
            {lowStockCount} items
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">Below reorder trigger</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 block mb-1">Cold Chain Target</span>
          <span className="text-xl font-bold font-mono tabular-nums text-neutral-900">
            3°C - 5°C
          </span>
          <span className="text-[11px] text-emerald-700 block mt-1">85-90% R.H.</span>
        </div>
      </div>

      {/* Search and Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Fresh Mushroom', 'Packaging Material', 'Farming Supply'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {cat === 'All'
                ? 'All Inventory'
                : cat === 'Fresh Mushroom'
                ? 'Fresh Mushrooms'
                : cat === 'Packaging Material'
                ? 'Packaging Materials'
                : 'Farming Supplies'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search stock item, variety, shed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 pl-9 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Item Name & Category</th>
                <th className="py-3 px-3">Storage Location</th>
                <th className="py-3 px-3 text-right">Harvested / Total</th>
                <th className="py-3 px-3 text-right">Reserved (Orders)</th>
                <th className="py-3 px-3 text-right">Sold</th>
                <th className="py-3 px-3 text-right">Spoiled / Waste</th>
                <th className="py-3 px-3 text-right">Available Stock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const isLow = item.availableStock <= item.reorderLevel;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-neutral-900">
                        {item.name}
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-normal mt-0.5">
                          <span className="font-mono text-neutral-400">{item.id}</span>
                          <span>·</span>
                          <span>{item.category}</span>
                          {item.expiryDate && (
                            <>
                              <span>·</span>
                              <span className="text-amber-700">Exp: {item.expiryDate}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-600">
                        {item.location || 'Main Storage'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-800">
                        {item.unit === 'kg' ? formatKg(item.harvestedStock) : `${item.harvestedStock} ${item.unit}`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-amber-700">
                        {item.unit === 'kg' ? formatKg(item.reservedStock) : `${item.reservedStock} ${item.unit}`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-600">
                        {item.unit === 'kg' ? formatKg(item.soldStock) : `${item.soldStock} ${item.unit}`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-600">
                        {item.unit === 'kg' ? formatKg(item.spoiledStock) : `${item.spoiledStock} ${item.unit}`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-base text-emerald-800">
                        {item.unit === 'kg' ? formatKg(item.availableStock) : `${item.availableStock} ${item.unit}`}
                      </td>
                      <td className="py-3 px-3">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSpoilageModalItem(item);
                              setSpoilageAmount(1);
                              setSpoilageReason('Cap browning / excessive moisture');
                            }}
                            title="Log Spoilage / Loss"
                            className="rounded border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                          >
                            Log Waste
                          </button>
                          <button
                            onClick={() => {
                              setAdjustModalItem(item);
                              setAdjustedAvailable(item.availableStock);
                              setAdjustReason('Physical inventory recount');
                            }}
                            title="Manual Stock Recount Adjustment"
                            className="rounded border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-neutral-400">
                    No items in inventory matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {addItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">Add Stock or Supply Item</h3>
              <button
                onClick={() => setAddItemModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Category *</label>
                  <select
                    value={newItemData.category}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, category: e.target.value as InventoryCategory })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value="Fresh Mushroom">Fresh Mushroom</option>
                    <option value="Packaging Material">Packaging Material</option>
                    <option value="Farming Supply">Farming Supply</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Unit of Measure *</label>
                  <select
                    value={newItemData.unit}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, unit: e.target.value as any })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value="kg">kg (weight)</option>
                    <option value="units">units (punnets, boxes)</option>
                    <option value="packets">packets (spawn, chemicals)</option>
                    <option value="rolls">rolls (film)</option>
                  </select>
                </div>
              </div>

              {newItemData.category === 'Fresh Mushroom' ? (
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Mushroom Variety *</label>
                  <select
                    value={newItemData.variety}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, variety: e.target.value as MushroomVariety })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value="Oyster (Dhingri)">Oyster (Dhingri)</option>
                    <option value="Button (Agaricus)">Button (Agaricus)</option>
                    <option value="Milky (Calocybe)">Milky (Calocybe)</option>
                    <option value="Shiitake">Shiitake</option>
                    <option value="King Oyster">King Oyster</option>
                    <option value="Paddy Straw">Paddy Straw</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Item Title / Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Perforated 200g Punnets"
                    value={newItemData.name}
                    onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemData.harvestedStock}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, harvestedStock: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Reorder Trigger</label>
                  <input
                    type="number"
                    step="1"
                    value={newItemData.reorderLevel}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, reorderLevel: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newItemData.unitCost}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, unitCost: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={newItemData.location}
                    onChange={(e) => setNewItemData({ ...newItemData, location: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Expiry / Shelf-life Date</label>
                  <input
                    type="date"
                    value={newItemData.expiryDate}
                    onChange={(e) => setNewItemData({ ...newItemData, expiryDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddItemModalOpen(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Spoilage Modal */}
      {spoilageModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900">
              Log Spoilage / Loss for {spoilageModalItem.name}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Currently available: {spoilageModalItem.availableStock} {spoilageModalItem.unit}
            </p>

            <form onSubmit={handleSpoilageSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Damaged / Expired Quantity ({spoilageModalItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  max={spoilageModalItem.availableStock}
                  required
                  value={spoilageAmount}
                  onChange={(e) => setSpoilageAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Reason / Cause</label>
                <select
                  value={spoilageReason}
                  onChange={(e) => setSpoilageReason(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                >
                  <option value="Cap browning / excessive moisture">Cap browning / excessive moisture</option>
                  <option value="Over-mature sporocarps / open gills">Over-mature sporocarps / open gills</option>
                  <option value="Cold chain breakdown / room warming">Cold chain breakdown / room warming</option>
                  <option value="Packaging physical crush damage">Packaging physical crush damage</option>
                  <option value="Bacterial blotch contamination">Bacterial blotch contamination</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSpoilageModalItem(null)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Deduct as Spoilage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900">
              Manual Stock Adjustment
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {adjustModalItem.name} · Current system available: {adjustModalItem.availableStock} {adjustModalItem.unit}
            </p>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Actual Physical Count ({adjustModalItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustedAvailable}
                  onChange={(e) => setAdjustedAvailable(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-5 py-2 text-xs font-semibold text-white"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
