import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Sprout,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import {
  ProductionBatch,
  MushroomVariety,
  SubstrateType,
  BatchStatus,
  HarvestFlush,
} from '../types';
import { formatINR, formatKg, calculateBatchMetrics } from '../utils/calculations';

export const ProductionView: React.FC = () => {
  const { t, batches, addBatch, updateBatch, deleteBatch, recordFlush } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [varietyFilter, setVarietyFilter] = useState<string>('All');

  // Modals
  const [newBatchModalOpen, setNewBatchModalOpen] = useState(false);
  const [flushModalBatch, setFlushModalBatch] = useState<ProductionBatch | null>(null);
  const [detailsBatch, setDetailsBatch] = useState<ProductionBatch | null>(null);

  // New Batch Form State
  const [formData, setFormData] = useState<{
    id: string;
    variety: MushroomVariety;
    customVarietyName: string;
    startDate: string;
    expectedHarvestDate: string;
    status: BatchStatus;
    bagCount: number;
    spawnQuantityKg: number;
    spawnCost: number;
    spawnSupplier: string;
    substrateType: SubstrateType;
    substrateQuantityKg: number;
    substrateCost: number;
    labourCost: number;
    electricityWaterCost: number;
    otherCosts: number;
    notes: string;
  }>({
    id: `BATCH-${new Date().getFullYear()}-0${batches.length + 1}`,
    variety: 'Oyster (Dhingri)',
    customVarietyName: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    status: 'Inoculation',
    bagCount: 100,
    spawnQuantityKg: 10,
    spawnCost: 1200,
    spawnSupplier: 'DMR Solan Center',
    substrateType: 'Wheat Straw',
    substrateQuantityKg: 100,
    substrateCost: 1100,
    labourCost: 1500,
    electricityWaterCost: 800,
    otherCosts: 200,
    notes: '',
  });

  // Flush Form State
  const [flushData, setFlushData] = useState<{
    flushNumber: number;
    harvestDate: string;
    quantityKg: number;
    rejectedKg: number;
    grade: 'Grade A' | 'Grade B' | 'Standard';
    notes: string;
  }>({
    flushNumber: 1,
    harvestDate: new Date().toISOString().split('T')[0],
    quantityKg: 25,
    rejectedKg: 1,
    grade: 'Grade A',
    notes: 'Fresh uniform clusters harvested in early morning',
  });

  // Filtered batches
  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.notes && b.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchesVariety = varietyFilter === 'All' || b.variety === varietyFilter;
    return matchesSearch && matchesStatus && matchesVariety;
  });

  // Handle New Batch Submit
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    addBatch({
      id: formData.id || `BATCH-${Date.now().toString().slice(-6)}`,
      variety: formData.variety,
      customVarietyName: formData.customVarietyName,
      startDate: formData.startDate,
      expectedHarvestDate: formData.expectedHarvestDate,
      status: formData.status,
      bagCount: Number(formData.bagCount) || 0,
      spawnQuantityKg: Number(formData.spawnQuantityKg) || 0,
      spawnCost: Number(formData.spawnCost) || 0,
      spawnSupplier: formData.spawnSupplier,
      substrateType: formData.substrateType,
      substrateQuantityKg: Number(formData.substrateQuantityKg) || 0,
      substrateCost: Number(formData.substrateCost) || 0,
      labourCost: Number(formData.labourCost) || 0,
      electricityWaterCost: Number(formData.electricityWaterCost) || 0,
      otherCosts: Number(formData.otherCosts) || 0,
      notes: formData.notes,
    });
    setNewBatchModalOpen(false);
  };

  // Handle Flush Submit
  const handleRecordFlushSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flushModalBatch) return;

    const saleable = Math.max(0, flushData.quantityKg - flushData.rejectedKg);

    recordFlush(flushModalBatch.id, {
      flushNumber: Number(flushData.flushNumber),
      harvestDate: flushData.harvestDate,
      quantityKg: Number(flushData.quantityKg),
      rejectedKg: Number(flushData.rejectedKg),
      saleableKg: saleable,
      grade: flushData.grade,
      notes: flushData.notes,
    });

    setFlushModalBatch(null);
  };

  const getStatusBadge = (status: BatchStatus) => {
    switch (status) {
      case 'Fruiting':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Spawn Run':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Pinheading':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'Inoculation':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Completed':
        return 'text-neutral-700 bg-neutral-100 border-neutral-300';
      case 'Terminated':
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
            {t.navProduction}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Track mushroom fruiting cycles, bag inoculation, costs, multi-flush yields, and biological efficiency.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              id: `BATCH-${new Date().getFullYear()}-0${batches.length + 1}`,
              variety: 'Oyster (Dhingri)',
              customVarietyName: '',
              startDate: new Date().toISOString().split('T')[0],
              expectedHarvestDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
              status: 'Inoculation',
              bagCount: 100,
              spawnQuantityKg: 10,
              spawnCost: 1200,
              spawnSupplier: 'DMR Solan Center',
              substrateType: 'Wheat Straw',
              substrateQuantityKg: 100,
              substrateCost: 1100,
              labourCost: 1500,
              electricityWaterCost: 800,
              otherCosts: 200,
              notes: '',
            });
            setNewBatchModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t.newBatchBtn}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by Batch ID, variety, notes..."
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
            <option value="Inoculation">Inoculation</option>
            <option value="Spawn Run">Spawn Run</option>
            <option value="Pinheading">Pinheading</option>
            <option value="Fruiting">Fruiting</option>
            <option value="Completed">Completed</option>
            <option value="Terminated">Terminated</option>
          </select>

          <select
            value={varietyFilter}
            onChange={(e) => setVarietyFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="All">All Varieties</option>
            <option value="Oyster (Dhingri)">Oyster (Dhingri)</option>
            <option value="Button (Agaricus)">Button (Agaricus)</option>
            <option value="Milky (Calocybe)">Milky (Calocybe)</option>
            <option value="Shiitake">Shiitake</option>
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4">{t.batchId}</th>
                <th className="py-3 px-3">{t.variety}</th>
                <th className="py-3 px-3">{t.status}</th>
                <th className="py-3 px-3 text-right">{t.bagCount}</th>
                <th className="py-3 px-3 text-right">{t.totalBatchCost}</th>
                <th className="py-3 px-3 text-right">{t.saleableYield}</th>
                <th className="py-3 px-3 text-right">{t.costPerKg}</th>
                <th className="py-3 px-3 text-right">{t.bioEfficiency}</th>
                <th className="py-3 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => {
                  return (
                    <tr key={batch.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                        {batch.id}
                      </td>
                      <td className="py-3 px-3 font-medium text-neutral-800">
                        {batch.variety}
                        {batch.customVarietyName && ` (${batch.customVarietyName})`}
                        <div className="text-[11px] text-neutral-400 font-normal">
                          {batch.substrateType} ({batch.substrateQuantityKg} kg)
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold ${getStatusBadge(
                            batch.status
                          )}`}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-700">
                        {batch.bagCount} bags
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-900 font-medium">
                        {formatINR(batch.totalBatchCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-800">
                        {formatKg(batch.saleableKg)}
                        <span className="block text-[10px] text-neutral-400 font-normal">
                          {batch.flushes.length} flush(es)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-700">
                        {batch.costPerKg > 0 ? formatINR(batch.costPerKg) + '/kg' : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            batch.biologicalEfficiency >= 50
                              ? 'text-emerald-700'
                              : batch.biologicalEfficiency > 0
                              ? 'text-amber-700'
                              : 'text-neutral-400'
                          }`}
                        >
                          {batch.biologicalEfficiency > 0 ? `${batch.biologicalEfficiency}%` : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setFlushModalBatch(batch);
                              setFlushData({
                                flushNumber: batch.flushes.length + 1,
                                harvestDate: new Date().toISOString().split('T')[0],
                                quantityKg: 20,
                                rejectedKg: 1,
                                grade: 'Grade A',
                                notes: '',
                              });
                            }}
                            title="Record Flush Harvest"
                            className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                          >
                            + Flush
                          </button>
                          <button
                            onClick={() => setDetailsBatch(batch)}
                            title="View Batch Details & Costing"
                            className="rounded-md border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-neutral-400">
                    No production batches found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Batch Modal */}
      {newBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">{t.newBatchBtn}</h3>
              <button
                onClick={() => setNewBatchModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="mt-4 space-y-4 text-xs">
              {/* Batch Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.batchId} *</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.variety} *</label>
                  <select
                    value={formData.variety}
                    onChange={(e) =>
                      setFormData({ ...formData, variety: e.target.value as MushroomVariety })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value="Oyster (Dhingri)">Oyster (Dhingri)</option>
                    <option value="Button (Agaricus)">Button (Agaricus)</option>
                    <option value="Milky (Calocybe)">Milky (Calocybe)</option>
                    <option value="Shiitake">Shiitake</option>
                    <option value="King Oyster">King Oyster</option>
                    <option value="Paddy Straw">Paddy Straw</option>
                    <option value="Custom">Custom Variety</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.status}</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as BatchStatus })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value="Inoculation">Inoculation</option>
                    <option value="Spawn Run">Spawn Run</option>
                    <option value="Pinheading">Pinheading</option>
                    <option value="Fruiting">Fruiting</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.startDate}</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.expectedHarvest}</label>
                  <input
                    type="date"
                    value={formData.expectedHarvestDate}
                    onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
              </div>

              {/* Cultivation Materials */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-3">
                <span className="font-semibold text-neutral-800 block">Cultivation Raw Materials & Spawn</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">{t.bagCount}</label>
                    <input
                      type="number"
                      value={formData.bagCount}
                      onChange={(e) => setFormData({ ...formData, bagCount: Number(e.target.value) })}
                      className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">{t.spawnQty}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.spawnQuantityKg}
                      onChange={(e) =>
                        setFormData({ ...formData, spawnQuantityKg: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">{t.spawnCost}</label>
                    <input
                      type="number"
                      value={formData.spawnCost}
                      onChange={(e) => setFormData({ ...formData, spawnCost: Number(e.target.value) })}
                      className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Spawn Lab / Supplier</label>
                    <input
                      type="text"
                      value={formData.spawnSupplier}
                      onChange={(e) => setFormData({ ...formData, spawnSupplier: e.target.value })}
                      className="w-full rounded-lg border border-neutral-200 p-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">{t.substrateType}</label>
                    <select
                      value={formData.substrateType}
                      onChange={(e) =>
                        setFormData({ ...formData, substrateType: e.target.value as SubstrateType })
                      }
                      className="w-full rounded-lg border border-neutral-200 p-2 bg-white"
                    >
                      <option value="Wheat Straw">Wheat Straw</option>
                      <option value="Paddy Straw">Paddy Straw</option>
                      <option value="Sawdust">Sawdust</option>
                      <option value="Compost (Button)">Compost (Button)</option>
                      <option value="Sugarcane Bagasse">Sugarcane Bagasse</option>
                      <option value="Cotton Waste">Cotton Waste</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">{t.substrateQty}</label>
                    <input
                      type="number"
                      step="1"
                      value={formData.substrateQuantityKg}
                      onChange={(e) =>
                        setFormData({ ...formData, substrateQuantityKg: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-neutral-200 p-2 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">{t.substrateCost}</label>
                    <input
                      type="number"
                      value={formData.substrateCost}
                      onChange={(e) =>
                        setFormData({ ...formData, substrateCost: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-neutral-200 p-2 font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Operational Production Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.labourCost}</label>
                  <input
                    type="number"
                    value={formData.labourCost}
                    onChange={(e) => setFormData({ ...formData, labourCost: Number(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.utilityCost}</label>
                  <input
                    type="number"
                    value={formData.electricityWaterCost}
                    onChange={(e) =>
                      setFormData({ ...formData, electricityWaterCost: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.otherCosts}</label>
                  <input
                    type="number"
                    value={formData.otherCosts}
                    onChange={(e) => setFormData({ ...formData, otherCosts: Number(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Pasteurization & Chamber Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Hot water pasteurization at 65°C for 2.5 hrs. Humidity misting set to 85%."
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>

              {/* Cost Summary Preview */}
              <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 p-3 text-emerald-900">
                <span className="font-medium">Total Batch Investment:</span>
                <span className="text-base font-bold font-mono">
                  {formatINR(
                    formData.spawnCost +
                      formData.substrateCost +
                      formData.labourCost +
                      formData.electricityWaterCost +
                      formData.otherCosts
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewBatchModalOpen(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  {t.create} Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Harvest Flush Modal */}
      {flushModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">{t.recordFlushBtn}</h3>
                <p className="text-xs text-neutral-500 font-mono">
                  {flushModalBatch.id} · {flushModalBatch.variety}
                </p>
              </div>
              <button
                onClick={() => setFlushModalBatch(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordFlushSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.flushNumber} *</label>
                  <select
                    value={flushData.flushNumber}
                    onChange={(e) =>
                      setFlushData({ ...flushData, flushNumber: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value={1}>Flush 1 (First harvest)</option>
                    <option value={2}>Flush 2 (Second harvest)</option>
                    <option value={3}>Flush 3 (Third harvest)</option>
                    <option value={4}>Flush 4 (Fourth harvest)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.flushDate} *</label>
                  <input
                    type="date"
                    required
                    value={flushData.harvestDate}
                    onChange={(e) => setFlushData({ ...flushData, harvestDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.totalHarvested} *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={flushData.quantityKg}
                    onChange={(e) =>
                      setFlushData({ ...flushData, quantityKg: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">{t.rejectedDamaged}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={flushData.rejectedKg}
                    onChange={(e) =>
                      setFlushData({ ...flushData, rejectedKg: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Quality Grade</label>
                  <select
                    value={flushData.grade}
                    onChange={(e) =>
                      setFlushData({ ...flushData, grade: e.target.value as any })
                    }
                    className="w-full rounded-lg border border-neutral-200 p-2"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Standard">Standard / Bulk</option>
                  </select>
                </div>
              </div>

              {/* Net Saleable Yield Preview */}
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-emerald-900">
                <span className="font-medium">Net Saleable Mushrooms:</span>
                <span className="text-base font-bold font-mono">
                  {formatKg(Math.max(0, flushData.quantityKg - flushData.rejectedKg))}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Saleable quantity will be automatically deposited into fresh mushroom inventory for sales.
              </p>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Harvest Notes</label>
                <input
                  type="text"
                  value={flushData.notes}
                  onChange={(e) => setFlushData({ ...flushData, notes: e.target.value })}
                  placeholder="e.g. Firm button caps, early morning picking"
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFlushModalBatch(null)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Save & Deposit to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Details Modal */}
      {detailsBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 font-mono">
                  {detailsBatch.id}
                </h3>
                <p className="text-xs text-neutral-500">
                  {detailsBatch.variety} · Status: <span className="font-semibold text-emerald-800">{detailsBatch.status}</span>
                </p>
              </div>
              <button
                onClick={() => setDetailsBatch(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Cost Breakdown */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2">
                <h4 className="font-bold text-neutral-900 text-sm">Full Batch Costing Ledger</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-neutral-500 block">Spawn Cost:</span>
                    <span className="font-mono font-semibold text-neutral-900">{formatINR(detailsBatch.spawnCost)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Substrate Cost:</span>
                    <span className="font-mono font-semibold text-neutral-900">{formatINR(detailsBatch.substrateCost)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Labour Wages:</span>
                    <span className="font-mono font-semibold text-neutral-900">{formatINR(detailsBatch.labourCost)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Electricity & Water:</span>
                    <span className="font-mono font-semibold text-neutral-900">{formatINR(detailsBatch.electricityWaterCost)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Other Direct Costs:</span>
                    <span className="font-mono font-semibold text-neutral-900">{formatINR(detailsBatch.otherCosts)}</span>
                  </div>
                  <div className="border-l border-neutral-200 pl-3">
                    <span className="text-neutral-500 block font-semibold">Total Batch Cost:</span>
                    <span className="font-mono font-bold text-base text-emerald-800">{formatINR(detailsBatch.totalBatchCost)}</span>
                  </div>
                </div>
              </div>

              {/* Yield & Biological Efficiency */}
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-neutral-200 p-4">
                <div>
                  <span className="text-neutral-500 block">Total Harvested:</span>
                  <span className="font-mono font-bold text-sm text-neutral-900">{formatKg(detailsBatch.totalHarvestedKg)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Saleable Yield:</span>
                  <span className="font-mono font-bold text-sm text-emerald-800">{formatKg(detailsBatch.saleableKg)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Biological Efficiency:</span>
                  <span className="font-mono font-bold text-sm text-blue-700">{detailsBatch.biologicalEfficiency}%</span>
                </div>
              </div>

              {/* Flushes Table */}
              <div>
                <h4 className="font-bold text-neutral-900 text-sm mb-2">Flush Harvesting Log</h4>
                {detailsBatch.flushes.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-neutral-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                        <tr>
                          <th className="p-2">Flush #</th>
                          <th className="p-2">Harvest Date</th>
                          <th className="p-2 text-right">Harvested</th>
                          <th className="p-2 text-right">Rejected</th>
                          <th className="p-2 text-right">Saleable</th>
                          <th className="p-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {detailsBatch.flushes.map((f) => (
                          <tr key={f.id}>
                            <td className="p-2 font-semibold">Flush {f.flushNumber}</td>
                            <td className="p-2 font-mono text-neutral-600">{f.harvestDate}</td>
                            <td className="p-2 text-right font-mono">{formatKg(f.quantityKg)}</td>
                            <td className="p-2 text-right font-mono text-rose-600">{formatKg(f.rejectedKg)}</td>
                            <td className="p-2 text-right font-mono font-semibold text-emerald-800">{formatKg(f.saleableKg)}</td>
                            <td className="p-2 text-neutral-500">{f.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-neutral-400 italic">No flushes harvested yet for this batch.</p>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
                <button
                  onClick={() => {
                    if (confirm(`Delete batch ${detailsBatch.id}?`)) {
                      deleteBatch(detailsBatch.id);
                      setDetailsBatch(null);
                    }
                  }}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Delete Batch Record
                </button>
                <button
                  onClick={() => setDetailsBatch(null)}
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
