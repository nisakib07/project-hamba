export interface ProfitCalculation {
  totalMeatRevenue: number;
  totalByproductRevenue: number;
  totalRevenue: number;
  buyingCost: number;
  foodCost: number;
  butcherCost: number;
  transportCost: number;
  otherExpenses: number;
  additionalExpenses: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  totalKgSold: number;
  profitPerKg: number;
  totalPaid: number;
  totalDue: number;
  remainingKg: number;
}

interface BatchData {
  buyingCost: number;
  foodCost: number;
  butcherCost: number;
  transportCost: number;
  otherExpenses: number;
  totalMeatKg: number;
}

interface MeatSaleData {
  kgQuantity: number;
  totalPrice: number;
  paidAmount: number;
  dueAmount: number;
}

interface ByproductData {
  total: number;
  paidAmount: number;
  dueAmount: number;
}

interface ExpenseData {
  amount: number;
}

export function calculateProfit(
  batch: BatchData,
  meatSales: MeatSaleData[],
  byproductSales: ByproductData[],
  expenses: ExpenseData[]
): ProfitCalculation {
  // Revenue
  const totalMeatRevenue = meatSales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalByproductRevenue = byproductSales.reduce((sum, s) => sum + s.total, 0);
  const totalRevenue = totalMeatRevenue + totalByproductRevenue;

  // Costs from batch
  const { buyingCost, foodCost, butcherCost, transportCost, otherExpenses } = batch;

  // Additional expenses tracked separately
  const additionalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const totalCost =
    buyingCost + foodCost + butcherCost + transportCost + otherExpenses + additionalExpenses;

  // Profit
  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Kg tracking
  const totalKgSold = meatSales.reduce((sum, s) => sum + s.kgQuantity, 0);
  const profitPerKg = totalKgSold > 0 ? netProfit / totalKgSold : 0;
  const remainingKg = batch.totalMeatKg - totalKgSold;

  // Payment tracking (meat + byproduct)
  const totalPaid = meatSales.reduce((sum, s) => sum + s.paidAmount, 0) + byproductSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalDue = meatSales.reduce((sum, s) => sum + s.dueAmount, 0) + byproductSales.reduce((sum, s) => sum + (s.dueAmount || 0), 0);

  return {
    totalMeatRevenue,
    totalByproductRevenue,
    totalRevenue,
    buyingCost,
    foodCost,
    butcherCost,
    transportCost,
    otherExpenses,
    additionalExpenses,
    totalCost,
    netProfit,
    profitMargin,
    totalKgSold,
    profitPerKg,
    totalPaid,
    totalDue,
    remainingKg,
  };
}
