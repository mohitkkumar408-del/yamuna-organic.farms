/**
 * Unit & Integration Tests for Mushroom Farm Business Calculations
 */

import {
  calculateBatchMetrics,
  calculateSaleInvoice,
  calculateAvailableStock,
  calculateFinancialSummary,
} from './calculations';
import { ProductionBatch, Sale, Expense } from '../types';

export function runCalculationTests(): { passed: boolean; results: { test: string; passed: boolean; message?: string }[] } {
  const results: { test: string; passed: boolean; message?: string }[] = [];

  function assert(condition: boolean, testName: string, failureMsg?: string) {
    if (condition) {
      results.push({ test: testName, passed: true });
    } else {
      results.push({ test: testName, passed: false, message: failureMsg || 'Assertion failed' });
    }
  }

  // 1. Test Batch Metrics & Biological Efficiency
  try {
    const mockBatch = {
      spawnCost: 1500,
      substrateCost: 2000,
      labourCost: 1200,
      electricityWaterCost: 800,
      otherCosts: 500,
      substrateQuantityKg: 100, // 100 kg dry substrate
      flushes: [
        { id: '1', batchId: 'b1', flushNumber: 1, harvestDate: '2026-10-01', quantityKg: 45, rejectedKg: 2, saleableKg: 43, recordedAt: '' },
        { id: '2', batchId: 'b1', flushNumber: 2, harvestDate: '2026-10-10', quantityKg: 30, rejectedKg: 1, saleableKg: 29, recordedAt: '' },
      ],
    };

    const metrics = calculateBatchMetrics(mockBatch);
    assert(metrics.totalBatchCost === 6000, 'Batch total cost equals sum of all cost categories (6000)');
    assert(metrics.totalHarvestedKg === 75, 'Total harvested equals sum of flushes (75 kg)');
    assert(metrics.saleableKg === 72, 'Saleable yield equals total minus rejected (72 kg)');
    // Biological efficiency: (75 / 100) * 100 = 75%
    assert(metrics.biologicalEfficiency === 75, 'Biological efficiency is accurately 75.0%');
    // Cost per kg: 6000 / 72 = 83.33
    assert(Math.abs(metrics.costPerKg - 83.33) < 0.1, 'Cost per kg calculated accurately ~83.33');
  } catch (err: any) {
    assert(false, 'Batch metrics test execution', err.message);
  }

  // 2. Test Sales Invoice & Payment Calculation
  try {
    const invoice1 = calculateSaleInvoice({
      quantityKg: 20,
      pricePerKg: 150,
      discount: 100,
      deliveryCharges: 50,
      amountReceived: 2950,
    });
    // Subtotal: 3000, Total: 3000 - 100 + 50 = 2950, Outstanding: 0, Paid
    assert(invoice1.totalAmount === 2950, 'Invoice total with discount & delivery is 2950');
    assert(invoice1.outstandingPayment === 0, 'Zero outstanding when fully received');
    assert(invoice1.paymentStatus === 'Paid', 'Status is Paid');

    const invoice2 = calculateSaleInvoice({
      quantityKg: 10,
      pricePerKg: 160,
      amountReceived: 600,
    });
    assert(invoice2.totalAmount === 1600, 'Invoice total 1600');
    assert(invoice2.outstandingPayment === 1000, 'Outstanding payment 1000');
    assert(invoice2.paymentStatus === 'Partial', 'Status is Partial when amount received < total');
  } catch (err: any) {
    assert(false, 'Sales invoice test execution', err.message);
  }

  // 3. Test Inventory Available Stock Calculation
  try {
    const stock = calculateAvailableStock({
      harvested: 100,
      reserved: 25,
      sold: 40,
      spoiled: 5,
    });
    // Available = 100 - 25 - 40 - 5 = 30
    assert(stock === 30, 'Available stock correctly deducts reserved, sold and spoiled (30 kg)');

    // Ensure negative prevention
    const negativeStock = calculateAvailableStock({
      harvested: 10,
      reserved: 10,
      sold: 10,
      spoiled: 0,
    });
    assert(negativeStock === 0, 'Available stock clamps to zero on edge conditions');
  } catch (err: any) {
    assert(false, 'Inventory calculation test execution', err.message);
  }

  // 4. Test Financial & P&L Calculation Matching Principle
  try {
    const mockBatches: ProductionBatch[] = [
      {
        id: 'B1',
        variety: 'Oyster (Dhingri)',
        startDate: '2026-09-01',
        expectedHarvestDate: '2026-09-25',
        status: 'Completed',
        bagCount: 100,
        spawnQuantityKg: 10,
        spawnCost: 1000,
        substrateType: 'Wheat Straw',
        substrateQuantityKg: 100,
        substrateCost: 1500,
        labourCost: 1000,
        electricityWaterCost: 500,
        otherCosts: 0,
        flushes: [],
        totalHarvestedKg: 60,
        rejectedKg: 0,
        saleableKg: 60,
        totalBatchCost: 4000, // 4000 / 60 = ₹66.67 per kg
        costPerKg: 66.67,
        biologicalEfficiency: 60,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const mockSales: Sale[] = [
      {
        id: 'INV-1',
        saleDate: '2026-10-01',
        customerName: 'Hotel Radhika',
        customerPhone: '9876543210',
        variety: 'Oyster (Dhingri)',
        quantityKg: 30, // Sold 30 kg
        pricePerKg: 150,
        discount: 0,
        deliveryCharges: 0,
        totalAmount: 4500, // Revenue 4500
        amountReceived: 3000, // Collection 3000
        outstandingPayment: 1500, // Outstanding 1500
        paymentMethod: 'UPI',
        paymentStatus: 'Partial',
        createdAt: '',
      },
    ];

    const mockExpenses: Expense[] = [
      {
        id: 'EXP-1',
        date: '2026-10-02',
        category: 'Rent',
        description: 'Facility shed rent',
        amount: 1000,
        paymentMethod: 'Bank Transfer',
        createdAt: '',
      },
    ];

    const summary = calculateFinancialSummary(mockSales, mockExpenses, mockBatches);
    // Revenue = 4500
    assert(summary.totalRevenue === 4500, 'Total recognized revenue is 4500');
    assert(summary.totalCashCollected === 3000, 'Total cash collected is 3000');
    assert(summary.totalOutstanding === 1500, 'Total outstanding receivable is 1500');
    // Unit cost for Oyster = 4000 / 60 = 66.67
    // COGS for 30 kg sold = 30 * 66.67 = 2000
    assert(Math.abs(summary.cogs - 2000) < 5, 'COGS correctly reflects cost of 30kg sold (~2000)');
    // Gross profit = 4500 - 2000 = 2500
    assert(Math.abs(summary.grossProfit - 2500) < 5, 'Gross profit is ~2500');
    // Net profit = 2500 - 1000 = 1500
    assert(Math.abs(summary.netProfit - 1500) < 5, 'Net profit is ~1500');
  } catch (err: any) {
    assert(false, 'P&L calculation test execution', err.message);
  }

  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
}
