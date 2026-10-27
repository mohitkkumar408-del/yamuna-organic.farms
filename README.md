# 🍄 Mushroom Farm Manager

A professional, full-stack responsive web application designed for commercial mushroom cultivation businesses in India. Engineered to manage the entire lifecycle from substrate pasteurization, inoculation, and multi-flush harvesting to cold-chain inventory, reservations, orders, GST tax invoicing, operating expense ledgers, and matching-principle Profit & Loss analytics.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, **Recharts**, **Lucide Icons**, and **Supabase (PostgreSQL)**.

---

## ✨ Key Features

1. **Executive Operations Dashboard**:
   - 11 live reactive statistics: Total Mushroom Production (kg), Total Mushrooms Sold (kg), Available Cold-Chain Stock (kg), Total Revenue (₹), Total Expenses (₹), Net Profit (₹), Pending Orders, Completed Orders, Cancelled Orders, Upcoming Harvests, and Low-Stock Warnings.
   - Interactive analytics charts powered by Recharts (Production Yields by Batch, Monthly Revenue vs Operating Costs & Profit, Fresh Stock by Variety, Order Status Distribution).
   - Date range filtering (All-time, Last 30 Days, Last 7 Days).

2. **Production Management & Costing**:
   - Inoculation batch tracking with unique Batch ID, spawn quantity/cost, bag counts, substrate types (Wheat Straw, Paddy Straw, Sawdust, Compost, Bagasse), substrate costs, and utility/labour allocation.
   - Multi-flush harvesting logs (Flush 1, Flush 2, Flush 3...) recording gross harvested, rejected, and net saleable yield.
   - Automatic calculation of **Total Batch Cost**, **Cost per kg (₹/kg)**, and **Biological Efficiency (B.E. %)**.
   - Automatic deposit of saleable harvested mushrooms directly into fresh inventory.

3. **Inventory & Cold Storage Management**:
   - Real-time stock equation: $\text{Available} = \text{Harvested} - \text{Reserved} - \text{Sold} - \text{Spoiled}$.
   - Automatic stock reservations upon order confirmation; automatic release upon cancellation; zero overselling protection.
   - Reorder level thresholds, shelf-life and expiry date tracking, spoilage logging, and physical weigh-scale recount adjustments.
   - Packaging material tracking (200g punnet trays, cling film, 5kg corrugated master boxes) and farming supplies (spawn, straw, chemicals).

4. **Order Management & Lifecycle**:
   - Order statuses: `New` ➔ `Confirmed` (auto-reserves stock) ➔ `Processing` ➔ `Ready for Dispatch` ➔ `Dispatched` ➔ `Completed` (fulfills and deducts stock exactly once, generates linked sales invoice) ➔ `Cancelled` (releases reserved stock).
   - Advance payment and balance due collection tracker.
   - Customer phone, delivery address, and dispatch notes.

5. **Sales & GST Invoicing**:
   - Invoice generator with unique invoice numbers (`INV-YYYY-XXX`), customer details, discount, delivery charges, cash collected, and outstanding receivables.
   - Support for Cash, UPI (PhonePe / Google Pay / Paytm), Bank Transfer (NEFT/RTGS), and Cheque.
   - **Print-ready Tax Invoice modal**: Formatted with farm header, GSTIN, customer details, itemized HSN codes, UPI QR placeholder, and authorized signatory line.
   - Separation of realized sales revenue vs actual cash liquidity collected.

6. **Expense Tracking Ledger**:
   - Categorized operational costs: Mushroom Spawn, Straw & Substrate, Compost, Bags & Packaging, Labour, Electricity, Water, Rent, Transportation, Equipment, Maintenance, Marketing, and Other.
   - Summary by category and one-click export of expense ledgers to CSV.

7. **Matching-Principle Profit & Loss (P&L)**:
   - Accrual accounting matching principle: $\text{Net Profit} = \text{Recognized Revenue} - \text{COGS} - \text{Operating Expenses}$.
   - Cost of Goods Sold (COGS) matches the unit cost per kg of harvested batches actually sold, rather than expensing unharvested crops.
   - Variety-wise profitability and batch-wise margin breakdown.

8. **Customers & Input Suppliers CRM**:
   - Directory with lifetime purchase values, outstanding balances, order counts, and direct one-click WhatsApp and phone call links.
   - Supplier ledger tracking input procurement and supplies provided.

9. **Bilingual Support & Cultivation Guide**:
   - Instant language switcher: **English** and **हिन्दी**.
   - ICAR-DMR Solan cultivation parameters guide for Oyster (*Pleurotus*), Button (*Agaricus bisporus*), Milky (*Calocybe indica*), and Shiitake (*Lentinula edodes*) with contamination management.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation & Running Locally

```bash
# 1. Clone repository
git clone https://github.com/your-username/mushroom-farm-manager.git
cd mushroom-farm-manager

# 2. Install dependencies
npm install

# 3. Create .env file from example
cp .env.example .env

# 4. Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser. The app runs immediately with realistic commercial mushroom farm sample data!

---

## 🗄️ Supabase Cloud Database Setup

The project includes complete PostgreSQL migrations for all 16 relational tables with Row Level Security (RLS) in `supabase/migrations/20261027000000_mushroom_farm_init.sql`.

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, choose an organization, set a project name (e.g. `mushroom-farm-manager`), database password, and select an Indian region (e.g., `ap-south-1` Mumbai).
3. Wait 1–2 minutes for database provisioning.

### Step 2: Run the SQL Migrations
1. In your Supabase dashboard, click **SQL Editor** on the left navigation bar.
2. Click **New Query**.
3. Open `supabase/migrations/20261027000000_mushroom_farm_init.sql` from this project, copy the entire SQL text, paste it into the Supabase SQL editor, and click **Run**.
4. All 16 tables (`profiles`, `farms`, `customers`, `suppliers`, `production_batches`, `harvest_records`, `inventory_items`, `inventory_movements`, `orders`, `order_items`, `sales`, `sale_items`, `payments`, `expenses`, `purchase_records`, `audit_logs`) along with indexes, RLS policies, and the `fulfill_order` atomic procedure will be created.

### Step 3: Configure Environment Variables
1. In your Supabase dashboard, go to **Project Settings** (gear icon) ➔ **API**.
2. Copy your **Project URL** and **anon / public key**.
3. Update your `.env` file:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```
4. Alternatively, open the **Database Backend** dialog in the app UI, paste your URL and key, and click **Save & Test Connection**.

---

## 🚢 Deployment Guide

### Option A: Deploy to Vercel (Recommended for Full-Stack)

1. Push your code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Mushroom Farm Manager"
   git branch -M main
   git remote add origin https://github.com/your-username/mushroom-farm-manager.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **Add New ➔ Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public anon key
5. Framework Preset: **Vite**.
6. Click **Deploy**. Vercel will build and assign a production URL.

### Option B: Deploy to GitHub Pages

For static hosting on GitHub Pages:
1. In `vite.config.ts`, set `base: '/mushroom-farm-manager/'` (matching your repo name).
2. Run `npm run build`.
3. Deploy the `dist` folder to the `gh-pages` branch using `gh-pages` npm package or GitHub Actions.

---

## 🧪 Verification & Automated Tests

The application includes an integrated verification test suite in `src/utils/calculations.test.ts`.

To verify calculation logic inside the app:
1. Click **Verify Business Logic** in the top navigation bar.
2. The modal runs deterministic assertions on:
   - Batch costing aggregation & Biological Efficiency percentage calculation
   - Sales invoice totals, discounts, delivery charges, and payment balance
   - Available inventory deduction and zero-clamping
   - Matching-principle Cost of Goods Sold (COGS) and net profit margins

---

## 🛠️ Common Troubleshooting

1. **Vite build error `command not found: vite`**:
   - Run `npm install` to install all dependencies from `package.json`.
2. **Missing Supabase connection**:
   - Verify that your URL starts with `https://` and that you copied the `anon` key, not the `service_role` key.
   - The app runs in local offline storage mode if Supabase credentials are not configured yet, ensuring zero downtime.
3. **Print Invoice styling**:
   - Use Google Chrome or modern Chromium/Firefox browsers for printing. Click **Print / Save PDF** to generate an invoice.

---

## 📜 License
Apache-2.0 License. Designed for mushroom farmers and agricultural enterprises across India.
