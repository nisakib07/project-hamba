# 🐄 Cow Batch Profit Manager (Project Hamba)

A highly optimized, production-ready, full-stack financial workspace designed specifically for livestock meat business operations. Treat each cow as an independent economic unit (batch) and manage its purchase, sales, byproducts, and expenses under a strict financial boundary.

Built using **Next.js (App Router)**, **MongoDB (Mongoose)**, **TypeScript**, **Tailwind CSS**, and **Recharts**.

---

## ✨ Features

### 🐄 1. Cow Batch (Parent Entity)
- Create individual batches for each cow purchase.
- Scope all financial data (sales, expenses, byproducts) strictly to its parent batch.
- Comprehensive cost tracking: Purchase/Buying, Food, Butcher, Transport, and Miscellaneous expenses.
- Editable batch metadata allowing retro-correction of price/kg, total weight, costs, status, and custom notes.

### 🥩 2. Meat Sales Workspace
- Scalable, real-time client sales entries.
- Automatical computation of Total Price and remaining Due amount based on payment tracking.
- Client search filter inside the batch.
- Bottom summary footer representing total weight sold, total revenue generated, total paid, and total due inside this scope.

### 🧾 3. Byproduct Sales Tracking
- Robust payment tracking (Paid vs. Due amount) for byproduct items (Chamra/Hide, Vuri/Intestine, Pa/Legs, and Others) mirroring the meat sales logic.
- Real-time calculations inside the Byproduct form.
- Bottom summary footer tracking byproduct sales performance.

### 💸 4. Expenses & Cash Flow
- Track additional batch-scoped expenses (food, butcher, medicine, transport, other).
- Quick aggregate summaries in the batch overview.

### 📊 5. Financial Dashboard & Analytics
- At-a-glance business KPI cards: Net Profit, Total Revenue, Total Cost, and Total Due.
- **Profit by Batch Chart**: A fully interactive Recharts bar chart showing profit vs. loss per batch (green/red indicator cells).
- **Recent Batches Feed**: Quick navigation to active or completed batch workspaces.
- **Overall Business Summary**: Displays aggregate metrics including Avg. Profit/kg.

### 💳 6. Due Recovery & Collection System
- An aggregated **Pending Dues** feed in each batch's Overview tab combining meat sales and byproduct dues.
- Direct **"Collect"** trigger to register partial payments, instantly updating cash flow, due balances, and batch margins.

---

## 🎨 Premium UI & Polish
- **Modern Dark Aesthetic**: A sleek glassmorphic theme designed to reduce eye-strain, with curated accent colors (Emerald green, Amber yellow, Crimson red).
- **Responsive Layout**: Designed for mobile viewports, including collapsible navigation sidebars and horizontally scrollable data tables.
- **Invoice Printing Support**: Clean, printer-friendly CSS styling that hides sidebars and forms, generating professional paper reports on `Ctrl + P`.
- **Confirmation Modals**: Replaced generic browser alert/confirms with beautiful styled modal dialogs.
- **Animations**: Subtle, smooth micro-animations and page transitions to ensure premium user experience.

---

## 🛠️ Tech Stack & Architecture
- **Framework:** Next.js 15 (React 19, App Router)
- **Database:** MongoDB Atlas via Mongoose ORM
- **Visualizations:** Recharts API
- **Icons:** React Icons
- **Calculations:** Server-side aggregation engine (`src/lib/profitCalculator.ts`)

---

## 🚀 Getting Started

### 1. Environment Configuration
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the workspace.
