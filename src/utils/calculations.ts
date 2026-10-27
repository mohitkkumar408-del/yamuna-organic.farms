import { ProductionBatch, Sale, Expense, MushroomVariety } from '../types';

/**
 * Calculates financial metrics for a single production batch.
 */
export function calculateBatchMetrics(
  batch: Pick<
    ProductionBatch,
    | 'spawnCost'
    | 'substrateCost'
    | 'labourCost'
    | 'electricityWaterCost'
    | 'otherCosts'
    | 'flushes'
    | 'substrateQuantityKg'
  >
) {
  const totalBatchCost =
    (Number(batch.spawnCost) || 0) +
    (Number(batch.substrateCost) || 0) +
    (Number(batch.labourCost) || 0) +
    (Number(batch.electricityWaterCost) || 0) +
    (Number(batch.otherCosts) || 0);

  const flushes = batch.flushes || [];
  const totalHarvestedKg = flushes.reduce((sum, f) => sum + (Number(f.quantityKg) || 0), 0);
  const rejectedKg = flushes.reduce((sum, f) => sum + (Number(f.rejectedKg) || 0), 0);
  const saleableKg = flushes.reduce((sum, f) => sum + (Number(f.saleableKg) || 0), 0);

  // Cost per kg is total cost divided by actual saleable yield.
  // If no harvest yet, returns 0.
  const costPerKg = saleableKg > 0 ? totalBatchCost / saleableKg : 0;

  // Biological efficiency (B.E. %) = (Fresh harvested mushroom weight / Dry substrate weight) * 100
  const drySubstrateKg = Number(batch.substrateQuantityKg) || 0;
  const biologicalEfficiency =
    drySubstrateKg > 0 ? (totalHarvestedKg / drySubstrateKg) * 100 : 0;

  return {
    totalBatchCost: Math.round(totalBatchCost * 100) / 100,
    totalHarvestedKg: Math.round(totalHarvestedKg * 100) / 100,
    rejectedKg: Math.round(rejectedKg * 100) / 100,
    saleableKg: Math.round(saleableKg * 100) / 100,
    costPerKg: Math.round(costPerKg * 100) / 100,
    biologicalEfficiency: Math.round(biologicalEfficiency * 10) / 10,
  };
}

/**
 * Calculates sale invoice totals including discount, delivery, and payment status.
 */
export function calculateSaleInvoice(params: {
  quantityKg: number;
  pricePerKg: number;
  discount?: number;
  deliveryCharges?: number;
  amountReceived?: number;
}) {
  const quantity = Math.max(0, Number(params.quantityKg) || 0);
  const price = Math.max(0, Number(params.pricePerKg) || 0);
  const discount = Math.max(0, Number(params.discount) || 0);
  const delivery = Math.max(0, Number(params.deliveryCharges) || 0);
  const received = Math.max(0, Number(params.amountReceived) || 0);

  const subtotal = quantity * price;
  const totalAmount = Math.max(0, subtotal - discount + delivery);
  const outstandingPayment = Math.max(0, totalAmount - received);

  let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
  if (received >= totalAmount && totalAmount > 0) {
    paymentStatus = 'Paid';
  } else if (received > 0 && received < totalAmount) {
    paymentStatus = 'Partial';
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    amountReceived: Math.round(received * 100) / 100,
    outstandingPayment: Math.round(outstandingPayment * 100) / 100,
    paymentStatus,
  };
}

/**
 * Calculates available stock preventing negative inventory.
 */
export function calculateAvailableStock(params: {
  harvested: number;
  reserved: number;
  sold: number;
  spoiled: number;
}) {
  const { harvested, reserved, sold, spoiled } = params;
  const net = (harvested || 0) - (reserved || 0) - (sold || 0) - (spoiled || 0);
  return Math.max(0, Math.round(net * 100) / 100);
}

/**
 * Calculates comprehensive financial and P&L metrics.
 * Follows consistent matching-principle accounting:
 * Realized Revenue - COGS (Cost of mushrooms sold) - Operating Expenses = Net Profit.
 */
export function calculateFinancialSummary(
  sales: Sale[],
  expenses: Expense[],
  batches: ProductionBatch[]
) {
  // 1. Total Recognized Revenue
  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

  // 2. Actual Cash Collected
  const totalCashCollected = sales.reduce((sum, s) => sum + (Number(s.amountReceived) || 0), 0);

  // 3. Outstanding Receivables
  const totalOutstanding = sales.reduce((sum, s) => sum + (Number(s.outstandingPayment) || 0), 0);

  // 4. Calculate weighted average cost per kg for each mushroom variety from batches
  const varietyCostMap = new Map<string, { totalCost: number; totalSaleableKg: number }>();
  
  batches.forEach((b) => {
    const current = varietyCostMap.get(b.variety) || { totalCost: 0, totalSaleableKg: 0 };
    current.totalCost += Number(b.totalBatchCost) || 0;
    current.totalSaleableKg += Number(b.saleableKg) || 0;
    varietyCostMap.set(b.variety, current);
  });

  const getUnitCostForVariety = (variety: MushroomVariety): number => {
    const data = varietyCostMap.get(variety);
    if (data && data.totalSaleableKg > 0) {
      return data.totalCost / data.totalSaleableKg;
    }
    // Standard industry baseline cost in India if no completed harvest yet:
    // Oyster: ~₹65/kg, Button: ~₹75/kg, Milky: ~₹70/kg, Shiitake: ~₹180/kg
    switch (variety) {
      case 'Oyster (Dhingri)':
        return 65;
      case 'Button (Agaricus)':
        return 75;
      case 'Milky (Calocybe)':
        return 70;
      case 'Shiitake':
        return 180;
      case 'King Oyster':
        return 140;
      case 'Paddy Straw':
        return 80;
      default:
        return 70;
    }
  };

  // 5. Cost of Goods Sold (COGS) based on actual mushrooms sold
  const cogs = sales.reduce((sum, s) => {
    const unitCost = getUnitCostForVariety(s.variety);
    return sum + (Number(s.quantityKg) || 0) * unitCost;
  }, 0);

  // 6. Total Operating Expenses (general overhead, rent, utility, transport logged in expenses)
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // 7. Gross Profit = Recognized Revenue - COGS
  const grossProfit = totalRevenue - cogs;

  // 8. Net Profit = Gross Profit - Total General Operating Expenses
  const netProfit = grossProfit - totalExpenses;

  // 9. Profit Margin %
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // 10. Variety-wise profitability breakdown
  const varietyStats: Record<
    string,
    {
      variety: string;
      soldKg: number;
      revenue: number;
      cogs: number;
      grossProfit: number;
      harvestedKg: number;
    }
  > = {};

  sales.forEach((s) => {
    if (!varietyStats[s.variety]) {
      varietyStats[s.variety] = {
        variety: s.variety,
        soldKg: 0,
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        harvestedKg: 0,
      };
    }
    const stat = varietyStats[s.variety];
    const unitCost = getUnitCostForVariety(s.variety);
    const saleCogs = (Number(s.quantityKg) || 0) * unitCost;
    stat.soldKg += Number(s.quantityKg) || 0;
    stat.revenue += Number(s.totalAmount) || 0;
    stat.cogs += saleCogs;
    stat.grossProfit += (Number(s.totalAmount) || 0) - saleCogs;
  });

  batches.forEach((b) => {
    if (!varietyStats[b.variety]) {
      varietyStats[b.variety] = {
        variety: b.variety,
        soldKg: 0,
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        harvestedKg: 0,
      };
    }
    varietyStats[b.variety].harvestedKg += Number(b.saleableKg) || 0;
  });

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCashCollected: Math.round(totalCashCollected * 100) / 100,
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    cogs: Math.round(cogs * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    profitMargin: Math.round(profitMargin * 10) / 10,
    varietyBreakdown: Object.values(varietyStats),
  };
}

/**
 * Format Indian Rupee currency with standard notation: ₹1,23,456
 */
export function formatINR(val: number): string {
  const rounded = Math.round(val || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rounded);
}

/**
 * Format weight in kg
 */
export function formatKg(val: number): string {
  return `${(Number(val) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} kg`;
}
