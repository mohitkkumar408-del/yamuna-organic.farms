import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ProductionBatch,
  Order,
  Sale,
  Expense,
  InventoryItem,
  Customer,
  Supplier,
  FarmProfile,
  HarvestFlush,
  OrderStatus,
  PaymentMethod,
} from '../types';
import {
  initialBatches,
  initialOrders,
  initialSales,
  initialExpenses,
  initialInventory,
  initialCustomers,
  initialSuppliers,
  initialFarmProfile,
} from '../data/initialData';
import {
  calculateBatchMetrics,
  calculateAvailableStock,
  calculateSaleInvoice,
} from '../utils/calculations';
import { Language, translations } from '../utils/translations';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';

interface FarmContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  
  farmProfile: FarmProfile;
  updateFarmProfile: (profile: Partial<FarmProfile>) => void;
  
  // Batches
  batches: ProductionBatch[];
  addBatch: (batch: Omit<ProductionBatch, 'flushes' | 'totalHarvestedKg' | 'rejectedKg' | 'saleableKg' | 'totalBatchCost' | 'costPerKg' | 'biologicalEfficiency' | 'createdAt' | 'updatedAt'>) => void;
  updateBatch: (id: string, updates: Partial<ProductionBatch>) => void;
  deleteBatch: (id: string) => void;
  recordFlush: (batchId: string, flushData: Omit<HarvestFlush, 'id' | 'batchId' | 'recordedAt'>) => void;
  
  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt' | 'availableStock'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  logSpoilage: (itemId: string, spoiledKg: number, reason: string) => void;
  adjustStock: (itemId: string, newAvailableKg: number, reason: string) => void;
  
  // Orders
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'stockReserved' | 'stockDeducted' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string };
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => { success: boolean; message?: string };
  deleteOrder: (id: string) => void;
  
  // Sales
  sales: Sale[];
  createSale: (saleData: Omit<Sale, 'id' | 'totalAmount' | 'outstandingPayment' | 'paymentStatus' | 'createdAt'>) => { success: boolean; message?: string };
  recordPayment: (saleId: string, amount: number, paymentMethod: PaymentMethod) => void;
  deleteSale: (id: string) => void;
  
  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  
  // Customers & Suppliers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'totalPurchasesAmount' | 'totalOrdersCount' | 'outstandingBalance' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchasesAmount' | 'outstandingPayables' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Database & utilities
  resetToDefaults: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
  supabaseConnected: boolean;
  checkSupabaseStatus: () => Promise<boolean>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const LS_PREFIX = 'mfm_v1_';

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(LS_PREFIX + 'lang') as Language) || 'en';
  });

  const [farmProfile, setFarmProfile] = useState<FarmProfile>(() => {
    const saved = localStorage.getItem(LS_PREFIX + 'profile');
    return saved ? JSON.parse(saved) : initialFarmProfile;
  });

  const [batches, setBatches] = useState<ProductionBatch[]>(() => {
    const saved = localStorage.getItem(LS_PREFIX + 'batches');
    return saved ? JSON.parse(saved) : initialBatches;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(LS_PREFIX + 'inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(LS_PREFIX + 'orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(LS_PREFIX + 'sales');
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(LS_PREFIX + 'expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(LS_PREFIX + 'customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(LS_PREFIX + 'suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'profile', JSON.stringify(farmProfile));
  }, [farmProfile]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  // Check Supabase connectivity
  const checkSupabaseStatus = async (): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      setSupabaseConnected(false);
      return false;
    }
    const client = getSupabaseClient();
    if (!client) {
      setSupabaseConnected(false);
      return false;
    }
    try {
      // Light check to see if remote is responding
      const { error } = await client.from('farms').select('count', { count: 'exact', head: true });
      if (!error) {
        setSupabaseConnected(true);
        return true;
      }
      setSupabaseConnected(true); // Connected to API endpoint
      return true;
    } catch (e) {
      setSupabaseConnected(false);
      return false;
    }
  };

  useEffect(() => {
    checkSupabaseStatus();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = translations[language];

  const updateFarmProfile = (profile: Partial<FarmProfile>) => {
    setFarmProfile((prev) => ({ ...prev, ...profile }));
  };

  // --- BATCHES ---
  const addBatch: FarmContextType['addBatch'] = (batchData) => {
    const now = new Date().toISOString();
    const metrics = calculateBatchMetrics({
      spawnCost: batchData.spawnCost,
      substrateCost: batchData.substrateCost,
      labourCost: batchData.labourCost,
      electricityWaterCost: batchData.electricityWaterCost,
      otherCosts: batchData.otherCosts,
      flushes: [],
      substrateQuantityKg: batchData.substrateQuantityKg,
    });

    const newBatch: ProductionBatch = {
      ...batchData,
      flushes: [],
      ...metrics,
      createdAt: now,
      updatedAt: now,
    };

    setBatches((prev) => [newBatch, ...prev]);
  };

  const updateBatch = (id: string, updates: Partial<ProductionBatch>) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const merged = { ...b, ...updates, updatedAt: new Date().toISOString() };
        const metrics = calculateBatchMetrics({
          spawnCost: merged.spawnCost,
          substrateCost: merged.substrateCost,
          labourCost: merged.labourCost,
          electricityWaterCost: merged.electricityWaterCost,
          otherCosts: merged.otherCosts,
          flushes: merged.flushes,
          substrateQuantityKg: merged.substrateQuantityKg,
        });
        return { ...merged, ...metrics };
      })
    );
  };

  const deleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
  };

  const recordFlush = (
    batchId: string,
    flushData: Omit<HarvestFlush, 'id' | 'batchId' | 'recordedAt'>
  ) => {
    const now = new Date().toISOString();
    const newFlush: HarvestFlush = {
      id: `FL-${Date.now().toString().slice(-6)}`,
      batchId,
      ...flushData,
      recordedAt: now,
    };

    let targetVariety: string = '';

    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b;
        targetVariety = b.variety;
        const updatedFlushes = [...b.flushes, newFlush];
        const metrics = calculateBatchMetrics({
          spawnCost: b.spawnCost,
          substrateCost: b.substrateCost,
          labourCost: b.labourCost,
          electricityWaterCost: b.electricityWaterCost,
          otherCosts: b.otherCosts,
          flushes: updatedFlushes,
          substrateQuantityKg: b.substrateQuantityKg,
        });
        return {
          ...b,
          flushes: updatedFlushes,
          ...metrics,
          actualHarvestDate: b.actualHarvestDate || flushData.harvestDate,
          updatedAt: now,
        };
      })
    );

    // Auto-update fresh mushroom inventory item with the saleable quantity
    if (flushData.saleableKg > 0 && targetVariety) {
      setInventory((prev) =>
        prev.map((item) => {
          if (item.category === 'Fresh Mushroom' && item.variety === targetVariety) {
            const newHarvested = item.harvestedStock + flushData.saleableKg;
            const newAvailable = calculateAvailableStock({
              harvested: newHarvested,
              reserved: item.reservedStock,
              sold: item.soldStock,
              spoiled: item.spoiledStock,
            });
            return {
              ...item,
              harvestedStock: newHarvested,
              availableStock: newAvailable,
              harvestDate: flushData.harvestDate,
              updatedAt: now,
            };
          }
          return item;
        })
      );
    }
  };

  // --- INVENTORY ---
  const addInventoryItem: FarmContextType['addInventoryItem'] = (itemData) => {
    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      ...itemData,
      id: `INV-${Date.now().toString().slice(-6)}`,
      availableStock: calculateAvailableStock({
        harvested: itemData.harvestedStock,
        reserved: itemData.reservedStock,
        sold: itemData.soldStock,
        spoiled: itemData.spoiledStock,
      }),
      updatedAt: now,
    };
    setInventory((prev) => [newItem, ...prev]);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates, updatedAt: new Date().toISOString() };
        const available = calculateAvailableStock({
          harvested: merged.harvestedStock,
          reserved: merged.reservedStock,
          sold: merged.soldStock,
          spoiled: merged.spoiledStock,
        });
        return { ...merged, availableStock: available };
      })
    );
  };

  const logSpoilage = (itemId: string, spoiledKg: number, _reason: string) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newSpoiled = (item.spoiledStock || 0) + spoiledKg;
        const available = calculateAvailableStock({
          harvested: item.harvestedStock,
          reserved: item.reservedStock,
          sold: item.soldStock,
          spoiled: newSpoiled,
        });
        return {
          ...item,
          spoiledStock: newSpoiled,
          availableStock: available,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const adjustStock = (itemId: string, newAvailableKg: number, _reason: string) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        // Adjust harvestedStock so that calculated availableStock matches newAvailableKg
        const targetHarvested =
          newAvailableKg + (item.reservedStock || 0) + (item.soldStock || 0) + (item.spoiledStock || 0);
        return {
          ...item,
          harvestedStock: targetHarvested,
          availableStock: Math.max(0, newAvailableKg),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // --- ORDERS ---
  const createOrder: FarmContextType['createOrder'] = (orderData) => {
    const now = new Date().toISOString();
    const newOrderId = `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    // Find stock for variety
    const stockItem = inventory.find(
      (i) => i.category === 'Fresh Mushroom' && i.variety === orderData.variety
    );

    const isReserved =
      orderData.status === 'Confirmed' ||
      orderData.status === 'Processing' ||
      orderData.status === 'Ready for Dispatch';

    if (isReserved) {
      if (!stockItem || stockItem.availableStock < orderData.quantityKg) {
        return {
          success: false,
          message: `Insufficient available stock for ${orderData.variety}. Available: ${stockItem?.availableStock || 0} kg, Requested: ${orderData.quantityKg} kg.`,
        };
      }
    }

    const newOrder: Order = {
      ...orderData,
      id: newOrderId,
      stockReserved: isReserved,
      stockDeducted: false,
      createdAt: now,
      updatedAt: now,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Reserve stock if confirmed
    if (isReserved && stockItem) {
      setInventory((prev) =>
        prev.map((item) => {
          if (item.id === stockItem.id) {
            const newReserved = (item.reservedStock || 0) + orderData.quantityKg;
            const available = calculateAvailableStock({
              harvested: item.harvestedStock,
              reserved: newReserved,
              sold: item.soldStock,
              spoiled: item.spoiledStock,
            });
            return {
              ...item,
              reservedStock: newReserved,
              availableStock: available,
              updatedAt: now,
            };
          }
          return item;
        })
      );
    }

    // Update customer stats
    if (orderData.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === orderData.customerId) {
            return {
              ...c,
              totalOrdersCount: (c.totalOrdersCount || 0) + 1,
            };
          }
          return c;
        })
      );
    }

    return { success: true };
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const now = new Date().toISOString();
    const stockItem = inventory.find(
      (i) => i.category === 'Fresh Mushroom' && i.variety === order.variety
    );

    // 1. If moving to Cancelled and stock was reserved, release reservation
    if (newStatus === 'Cancelled' && order.stockReserved && !order.stockDeducted) {
      if (stockItem) {
        setInventory((prev) =>
          prev.map((item) => {
            if (item.id === stockItem.id) {
              const newReserved = Math.max(0, (item.reservedStock || 0) - order.quantityKg);
              const available = calculateAvailableStock({
                harvested: item.harvestedStock,
                reserved: newReserved,
                sold: item.soldStock,
                spoiled: item.spoiledStock,
              });
              return { ...item, reservedStock: newReserved, availableStock: available, updatedAt: now };
            }
            return item;
          })
        );
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, stockReserved: false, updatedAt: now } : o))
      );
      return { success: true };
    }

    // 2. If moving to Confirmed/Processing and not previously reserved, reserve stock
    if (
      (newStatus === 'Confirmed' || newStatus === 'Processing' || newStatus === 'Ready for Dispatch') &&
      !order.stockReserved &&
      !order.stockDeducted
    ) {
      if (stockItem && stockItem.availableStock < order.quantityKg) {
        return {
          success: false,
          message: `Cannot confirm order: Available stock (${stockItem.availableStock} kg) is less than order quantity (${order.quantityKg} kg).`,
        };
      }
      if (stockItem) {
        setInventory((prev) =>
          prev.map((item) => {
            if (item.id === stockItem.id) {
              const newReserved = (item.reservedStock || 0) + order.quantityKg;
              const available = calculateAvailableStock({
                harvested: item.harvestedStock,
                reserved: newReserved,
                sold: item.soldStock,
                spoiled: item.spoiledStock,
              });
              return { ...item, reservedStock: newReserved, availableStock: available, updatedAt: now };
            }
            return item;
          })
        );
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, stockReserved: true, updatedAt: now } : o))
      );
      return { success: true };
    }

    // 3. If moving to Completed: DEDUCT STOCK EXACTLY ONCE and GENERATE SALE INVOICE
    if (newStatus === 'Completed') {
      if (order.stockDeducted) {
        // Already deducted, just update status if needed
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: now } : o)));
        return { success: true };
      }

      // Deduct from stock: release reserved and add to soldStock
      if (stockItem) {
        setInventory((prev) =>
          prev.map((item) => {
            if (item.id === stockItem.id) {
              const newReserved = order.stockReserved
                ? Math.max(0, (item.reservedStock || 0) - order.quantityKg)
                : item.reservedStock;
              const newSold = (item.soldStock || 0) + order.quantityKg;
              const available = calculateAvailableStock({
                harvested: item.harvestedStock,
                reserved: newReserved,
                sold: newSold,
                spoiled: item.spoiledStock,
              });
              return {
                ...item,
                reservedStock: newReserved,
                soldStock: newSold,
                availableStock: available,
                updatedAt: now,
              };
            }
            return item;
          })
        );
      }

      // Generate invoice
      const newInvoiceId = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const invoiceCalc = calculateSaleInvoice({
        quantityKg: order.quantityKg,
        pricePerKg: order.pricePerKg,
        amountReceived: order.advancePayment,
      });

      const newSale: Sale = {
        id: newInvoiceId,
        orderId: order.id,
        saleDate: new Date().toISOString().split('T')[0],
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.deliveryAddress,
        variety: order.variety,
        quantityKg: order.quantityKg,
        pricePerKg: order.pricePerKg,
        discount: 0,
        deliveryCharges: 0,
        totalAmount: invoiceCalc.totalAmount,
        amountReceived: invoiceCalc.amountReceived,
        outstandingPayment: invoiceCalc.outstandingPayment,
        paymentMethod: 'UPI',
        paymentStatus: invoiceCalc.paymentStatus,
        notes: `Auto-generated from completed Order #${order.id}. ${order.notes || ''}`,
        createdAt: now,
      };

      setSales((prev) => [newSale, ...prev]);

      // Update customer total purchases and outstanding balance
      if (order.customerId) {
        setCustomers((prev) =>
          prev.map((c) => {
            if (c.id === order.customerId) {
              return {
                ...c,
                totalPurchasesAmount: (c.totalPurchasesAmount || 0) + invoiceCalc.totalAmount,
                outstandingBalance: (c.outstandingBalance || 0) + invoiceCalc.outstandingPayment,
              };
            }
            return c;
          })
        );
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'Completed',
                stockReserved: false,
                stockDeducted: true,
                saleInvoiceId: newInvoiceId,
                updatedAt: now,
              }
            : o
        )
      );

      return { success: true };
    }

    // Default status update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: now } : o)));
    return { success: true };
  };

  const deleteOrder = (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (order && order.stockReserved && !order.stockDeducted) {
      // Release reservation
      const stockItem = inventory.find(
        (i) => i.category === 'Fresh Mushroom' && i.variety === order.variety
      );
      if (stockItem) {
        setInventory((prev) =>
          prev.map((item) => {
            if (item.id === stockItem.id) {
              const newReserved = Math.max(0, (item.reservedStock || 0) - order.quantityKg);
              const available = calculateAvailableStock({
                harvested: item.harvestedStock,
                reserved: newReserved,
                sold: item.soldStock,
                spoiled: item.spoiledStock,
              });
              return { ...item, reservedStock: newReserved, availableStock: available };
            }
            return item;
          })
        );
      }
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // --- SALES ---
  const createSale: FarmContextType['createSale'] = (saleData) => {
    const now = new Date().toISOString();
    const stockItem = inventory.find(
      (i) => i.category === 'Fresh Mushroom' && i.variety === saleData.variety
    );

    if (!stockItem || stockItem.availableStock < saleData.quantityKg) {
      return {
        success: false,
        message: `Insufficient available stock for ${saleData.variety}. Available: ${stockItem?.availableStock || 0} kg, Requested: ${saleData.quantityKg} kg.`,
      };
    }

    const calc = calculateSaleInvoice({
      quantityKg: saleData.quantityKg,
      pricePerKg: saleData.pricePerKg,
      discount: saleData.discount,
      deliveryCharges: saleData.deliveryCharges,
      amountReceived: saleData.amountReceived,
    });

    const newSaleId = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newSale: Sale = {
      ...saleData,
      id: newSaleId,
      totalAmount: calc.totalAmount,
      amountReceived: calc.amountReceived,
      outstandingPayment: calc.outstandingPayment,
      paymentStatus: calc.paymentStatus,
      createdAt: now,
    };

    setSales((prev) => [newSale, ...prev]);

    // Deduct stock directly
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === stockItem.id) {
          const newSold = (item.soldStock || 0) + saleData.quantityKg;
          const available = calculateAvailableStock({
            harvested: item.harvestedStock,
            reserved: item.reservedStock,
            sold: newSold,
            spoiled: item.spoiledStock,
          });
          return { ...item, soldStock: newSold, availableStock: available, updatedAt: now };
        }
        return item;
      })
    );

    // Update customer records if found
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.name.toLowerCase() === saleData.customerName.toLowerCase()) {
          return {
            ...c,
            totalPurchasesAmount: (c.totalPurchasesAmount || 0) + calc.totalAmount,
            outstandingBalance: (c.outstandingBalance || 0) + calc.outstandingPayment,
          };
        }
        return c;
      })
    );

    return { success: true };
  };

  const recordPayment = (saleId: string, amount: number, paymentMethod: PaymentMethod) => {
    setSales((prev) =>
      prev.map((s) => {
        if (s.id !== saleId) return s;
        const newReceived = (s.amountReceived || 0) + amount;
        const newOutstanding = Math.max(0, s.totalAmount - newReceived);
        let status: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
        if (newReceived >= s.totalAmount) {
          status = 'Paid';
        } else if (newReceived > 0) {
          status = 'Partial';
        }

        // Also reduce customer outstanding balance
        setCustomers((cList) =>
          cList.map((c) => {
            if (c.name.toLowerCase() === s.customerName.toLowerCase()) {
              return {
                ...c,
                outstandingBalance: Math.max(0, (c.outstandingBalance || 0) - amount),
              };
            }
            return c;
          })
        );

        return {
          ...s,
          amountReceived: newReceived,
          outstandingPayment: newOutstanding,
          paymentStatus: status,
          paymentMethod,
        };
      })
    );
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  };

  // --- EXPENSES ---
  const addExpense: FarmContextType['addExpense'] = (expenseData) => {
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expenseData,
      id: `EXP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: now,
    };
    setExpenses((prev) => [newExpense, ...prev]);

    // If linked to supplier, update supplier total purchases
    if (expenseData.supplier) {
      setSuppliers((prev) =>
        prev.map((sup) => {
          if (sup.name.toLowerCase() === expenseData.supplier?.toLowerCase()) {
            return {
              ...sup,
              totalPurchasesAmount: (sup.totalPurchasesAmount || 0) + expenseData.amount,
            };
          }
          return sup;
        })
      );
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // --- CUSTOMERS & SUPPLIERS ---
  const addCustomer: FarmContextType['addCustomer'] = (data) => {
    const newCustomer: Customer = {
      ...data,
      id: `CUST-${Date.now().toString().slice(-4)}`,
      totalPurchasesAmount: 0,
      totalOrdersCount: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const addSupplier: FarmContextType['addSupplier'] = (data) => {
    const newSupplier: Supplier = {
      ...data,
      id: `SUP-${Date.now().toString().slice(-4)}`,
      totalPurchasesAmount: 0,
      outstandingPayables: 0,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  // --- UTILITIES & BACKUP ---
  const resetToDefaults = () => {
    setBatches(initialBatches);
    setInventory(initialInventory);
    setOrders(initialOrders);
    setSales(initialSales);
    setExpenses(initialExpenses);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setFarmProfile(initialFarmProfile);
  };

  const exportDatabaseJSON = (): string => {
    const fullDump = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      farmProfile,
      batches,
      inventory,
      orders,
      sales,
      expenses,
      customers,
      suppliers,
    };
    return JSON.stringify(fullDump, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.batches && parsed.inventory && parsed.orders) {
        if (parsed.farmProfile) setFarmProfile(parsed.farmProfile);
        setBatches(parsed.batches);
        setInventory(parsed.inventory);
        setOrders(parsed.orders);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.suppliers) setSuppliers(parsed.suppliers);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      farmProfile,
      updateFarmProfile,
      batches,
      addBatch,
      updateBatch,
      deleteBatch,
      recordFlush,
      inventory,
      addInventoryItem,
      updateInventoryItem,
      logSpoilage,
      adjustStock,
      orders,
      createOrder,
      updateOrderStatus,
      deleteOrder,
      sales,
      createSale,
      recordPayment,
      deleteSale,
      expenses,
      addExpense,
      deleteExpense,
      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      suppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      resetToDefaults,
      exportDatabaseJSON,
      importDatabaseJSON,
      supabaseConnected,
      checkSupabaseStatus,
    }),
    [language, t, farmProfile, batches, inventory, orders, sales, expenses, customers, suppliers, supabaseConnected]
  );

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
};

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}
