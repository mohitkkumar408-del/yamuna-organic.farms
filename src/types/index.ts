/**
 * Mushroom Farm Manager - Type Definitions
 * Designed for commercial mushroom farming business operations in India.
 */

export type MushroomVariety = 
  | 'Oyster (Dhingri)'
  | 'Button (Agaricus)'
  | 'Milky (Calocybe)'
  | 'Shiitake'
  | 'King Oyster'
  | 'Paddy Straw'
  | 'Custom';

export type SubstrateType = 
  | 'Wheat Straw'
  | 'Paddy Straw'
  | 'Sawdust'
  | 'Sugarcane Bagasse'
  | 'Cotton Waste'
  | 'Compost (Button)'
  | 'Other';

export type BatchStatus = 
  | 'Inoculation'
  | 'Spawn Run'
  | 'Pinheading'
  | 'Fruiting'
  | 'Completed'
  | 'Terminated';

export interface HarvestFlush {
  id: string;
  batchId: string;
  flushNumber: number;
  harvestDate: string; // ISO date string YYYY-MM-DD
  quantityKg: number;
  rejectedKg: number;
  saleableKg: number;
  grade?: 'Grade A' | 'Grade B' | 'Standard';
  notes?: string;
  recordedAt: string;
}

export interface ProductionBatch {
  id: string; // Unique Batch ID e.g. BATCH-OYS-2026-01
  variety: MushroomVariety;
  customVarietyName?: string;
  startDate: string; // YYYY-MM-DD
  expectedHarvestDate: string; // YYYY-MM-DD
  actualHarvestDate?: string;
  status: BatchStatus;
  
  // Cultivation specs
  bagCount: number;
  spawnQuantityKg: number;
  spawnCost: number; // in ₹
  spawnSupplier?: string;
  
  substrateType: SubstrateType;
  substrateQuantityKg: number;
  substrateCost: number; // in ₹
  
  // Production operational costs
  labourCost: number; // in ₹
  electricityWaterCost: number; // in ₹
  otherCosts: number; // in ₹
  
  // Harvest & yield totals
  flushes: HarvestFlush[];
  totalHarvestedKg: number;
  rejectedKg: number;
  saleableKg: number;
  
  // Auto calculated metrics
  totalBatchCost: number; // Sum of all costs
  costPerKg: number; // totalBatchCost / saleableKg (or 0 if not harvested)
  biologicalEfficiency: number; // (totalHarvestedKg / drySubstrateKg) * 100
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'New'
  | 'Confirmed'
  | 'Processing'
  | 'Ready for Dispatch'
  | 'Dispatched'
  | 'Completed'
  | 'Cancelled';

export interface OrderItem {
  variety: MushroomVariety;
  quantityKg: number;
  pricePerKg: number;
  subtotal: number;
}

export interface Order {
  id: string; // e.g. ORD-2026-001
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  orderDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  variety: MushroomVariety;
  quantityKg: number;
  pricePerKg: number;
  totalAmount: number;
  advancePayment: number;
  balancePayment: number;
  notes?: string;
  status: OrderStatus;
  
  // Stock tracking flags
  stockReserved: boolean;
  stockDeducted: boolean;
  saleInvoiceId?: string;
  
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface Sale {
  id: string; // Unique Sale/Invoice ID e.g. MFM-INV-2026-001
  orderId?: string; // linked order if generated from order
  saleDate: string; // YYYY-MM-DD
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  variety: MushroomVariety;
  quantityKg: number;
  pricePerKg: number;
  discount: number; // in ₹
  deliveryCharges: number; // in ₹
  totalAmount: number; // (quantityKg * pricePerKg) - discount + deliveryCharges
  amountReceived: number; // actual cash collected
  outstandingPayment: number; // totalAmount - amountReceived
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Mushroom Spawn'
  | 'Straw & Substrate'
  | 'Compost'
  | 'Bags & Packaging'
  | 'Labour'
  | 'Electricity'
  | 'Water'
  | 'Rent'
  | 'Transportation'
  | 'Equipment'
  | 'Maintenance'
  | 'Marketing'
  | 'Other';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory | string;
  description: string;
  amount: number; // in ₹
  paymentMethod: PaymentMethod;
  supplier?: string;
  receiptNote?: string;
  createdAt: string;
}

export type InventoryCategory = 'Fresh Mushroom' | 'Packaging Material' | 'Farming Supply';

export interface InventoryItem {
  id: string;
  category: InventoryCategory;
  name: string;
  variety?: MushroomVariety;
  batchId?: string;
  unit: 'kg' | 'units' | 'rolls' | 'packets';
  
  // Stock quantities
  harvestedStock: number; // Total harvested historically or received
  reservedStock: number; // Reserved for confirmed orders
  soldStock: number; // Sold out
  spoiledStock: number; // Damaged or expired
  availableStock: number; // currently physically ready to sell
  
  harvestDate?: string;
  expiryDate?: string;
  reorderLevel: number;
  unitCost: number; // in ₹
  location?: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  totalPurchasesAmount: number;
  totalOrdersCount: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  productsSupplied: string;
  totalPurchasesAmount: number;
  outstandingPayables: number;
  createdAt: string;
}

export interface FarmProfile {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  gstin?: string;
  upiId?: string;
  currency: string;
  weightUnit: string;
}

export interface GrowthParameterGuide {
  variety: MushroomVariety;
  optimumTempSpawnRun: string;
  optimumTempFruiting: string;
  optimumHumidity: string;
  spawnRunDays: string;
  fruitingDays: string;
  substrate: string;
  biologicalEfficiencyExpected: string;
  lightRequirement: string;
  co2Level: string;
}
