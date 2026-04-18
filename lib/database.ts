import AsyncStorage from "@react-native-async-storage/async-storage";

// ==================== TYPES ====================

export interface MotoEarning {
  id: string;
  appName: string;
  value: number;
  date: string;
  status: "pending" | "received" | "partial";
  receivedValue?: number;
  receivedDate?: string;
  createdAt: string;
}

export interface DailyKm {
  id: string;
  km: number;
  date: string;
  createdAt: string;
}

export interface Maintenance {
  id: string;
  item: string;
  km: number;
  value: number;
  location?: string;
  date: string;
  createdAt: string;
}

export interface MaintenanceForecast {
  id: string;
  item: string;
  unitCost: number;
  kmDuration: number; // KM para troca (ex: óleo a cada 3000km)
  notificationEnabled: boolean; // Controla se notificações estão ativas para esta previsão
  createdAt: string;
}

export interface ForecastConfig {
  annualKm: number;
  workDaysPerWeek: number;
  dailyGoal?: number;
  valuePerKm?: number;
}

export interface FinancialEntry {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  value: number;
  date: string;
  dueDate?: string;
  paymentDate?: string;
  isPaid: boolean;
  isFixed: boolean;
  isVariable?: boolean;
  autoRenew?: boolean;
  isInstallment: boolean;
  installmentTotal?: number;
  installmentCurrent?: number;
  installmentGroupId?: string;
  installmentPeriod?: "week" | "month";
  fixedPeriod?: "weekly" | "monthly";
  totalInstallments?: number;
  currentInstallment?: number;
  createdAt: string;
}

export interface MonthlyBill {
  id: string;
  name: string;
  value: number;
  dueDate: string;
  isPaid: boolean;
  paymentDate?: string;
  month: string;
  accountType: "fixed" | "installment";
  autoRenew: boolean;
  installmentTotal?: number;
  installmentCurrent?: number;
  installmentPeriod?: "week" | "month";
  createdAt: string;
}

export interface Investment {
  id: string;
  name: string;
  value: number;
  yieldPercentage: number;
  date: string;
  type: "deposit" | "withdrawal";
  wallet?: string;
  createdAt: string;
}

export interface ExtraIncome {
  id: string;
  name: string;
  value: number;
  date: string;
  createdAt: string;
}

export interface CategoryLimit {
  category: string;
  limit: number;
  period: "week" | "month";
}

export interface Workshop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
}

// ==================== WORK SHIFTS (HORAS TRABALHADAS) ====================

export interface WorkShift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  createdAt: string;
}

// ==================== ROLO (COMPRA E VENDA) ====================

export interface RoloProduct {
  id: string;
  name: string;
  purchasePrice: number;
  quantity: number;
  quantitySold: number;
  suggestedSalePrice: number;
  profitMargin: number;
  date: string;
  createdAt: string;
}

export interface RoloSale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  totalValue: number;
  date: string;
  createdAt: string;
}

export interface RoloWithdrawal {
  id: string;
  value: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface AppPaymentConfig {
  appName: string;
  paymentMode: "next_day" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "weekly" | "manual" | "instant";
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  yieldRate: number;
  lastYieldDate?: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: "deposit" | "withdrawal" | "yield";
  value: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface WeeklyKmCost {
  id: string;
  weekStart: string;
  weekEnd: string;
  totalKm: number;
  costPerKm: number;
  totalCost: number;
  status: "open" | "closed" | "paid";
  paidDate?: string;
  createdAt: string;
}

export interface AppConfig {
  costPerKm: number;
  apps: string[];
  maintenanceItems: string[];
  dashboardBlocks: string[];
  investmentPercentage: number;
  investmentCalcMode: "weekly" | "monthly";
  investmentMode: "auto" | "manual";
  financialCategories: string[];
  forecastConfig: ForecastConfig;
  workDaysPerWeek: number;
  categoryLimits: CategoryLimit[];
  workshops: Workshop[];
  appPaymentConfigs: AppPaymentConfig[];
  wallets: Wallet[];
  backupEnabled: boolean;
  backupLastDate?: string;
  spendingLimits: CategoryLimit[];
  expenseCategories: string[];
  incomeCategories: string[];
  estimatedWeeklyKmCost: number;
  estimatedWeeklyFoodCost: number;
  initialBalance: number;
  maintenanceCategories: string[];
  appColors: Record<string, string>;
  reserveInWeeklyGoal: boolean;
  weeklyGoalMode: "current" | "next";
  currentMotoKm: number;
  roloInitialBalance: number;
}

// ==================== STORAGE KEYS ====================

const KEYS = {
  ROLO_PRODUCTS: "@motocontrole:rolo_products",
  ROLO_SALES: "@motocontrole:rolo_sales",
  ROLO_WITHDRAWALS: "@motocontrole:rolo_withdrawals",
  WORK_SHIFTS: "@motocontrole:work_shifts",
  MOTO_EARNINGS: "@motocontrole:moto_earnings",
  DAILY_KM: "@motocontrole:daily_km",
  MAINTENANCE: "@motocontrole:maintenance",
  MAINTENANCE_FORECAST: "@motocontrole:maintenance_forecast",
  FINANCIAL_ENTRIES: "@motocontrole:financial_entries",
  MONTHLY_BILLS: "@motocontrole:monthly_bills",
  INVESTMENTS: "@motocontrole:investments",
  EXTRA_INCOME: "@motocontrole:extra_income",
  CONFIG: "@motocontrole:config",
  WALLET_TRANSACTIONS: "@motocontrole:wallet_transactions",
  WEEKLY_KM_COSTS: "@motocontrole:weekly_km_costs",
};

// ==================== DEFAULT CONFIG ====================

export const DEFAULT_CONFIG: AppConfig = {
  costPerKm: 0.35,
  apps: ["iFood", "99Food", "Uber Eats", "Rappi", "Lalamove", "Loggi"],
  maintenanceItems: [
    "Pneu Traseiro", "Pneu Dianteiro", "Óleo do Motor", "Corrente",
    "Pastilha de Freio", "Relação", "Vela", "Filtro de Ar",
    "Cabo de Acelerador", "Bateria",
  ],
  dashboardBlocks: [
    "balance", "weeklyGoal", "monthlyCosts", "weeklyEarnings",
    "monthlyEarnings", "totalKm", "avgPerKm", "netProfit",
    "weeklyChart", "earningsVsBills",
  ],
  investmentPercentage: 10,
  investmentCalcMode: "weekly",
  investmentMode: "auto",
  financialCategories: [
    "Aluguel", "Luz", "Água", "Internet", "Mercado", "Combustível",
    "Celular", "Lazer", "Saúde", "Educação", "Transporte", "Moto", "Outros",
  ],
  forecastConfig: { annualKm: 50000, workDaysPerWeek: 6 },
  workDaysPerWeek: 5,
  categoryLimits: [],
  workshops: [],
  appPaymentConfigs: [],
  wallets: [
    { id: "wallet_reserva", name: "Reserva de Emergência", balance: 0, yieldRate: 1.0, createdAt: new Date().toISOString() },
    { id: "wallet_moto", name: "Moto", balance: 0, yieldRate: 0, createdAt: new Date().toISOString() },
  ],
  backupEnabled: false,
  spendingLimits: [],
  expenseCategories: [
    "Combustível", "Alimentação", "Manutenção Moto", "Aluguel",
    "Internet", "Celular", "Lazer", "Saúde", "Educação", "Outros",
  ],
  incomeCategories: [
    "Salário", "Freelance", "Venda", "Bônus", "Presente", "Outros",
  ],
  estimatedWeeklyKmCost: 0,
  estimatedWeeklyFoodCost: 0,
  initialBalance: 0,
  maintenanceCategories: [
    "Pneu Traseiro", "Pneu Dianteiro", "Óleo do Motor", "Corrente",
    "Pastilha de Freio", "Relação", "Vela", "Filtro de Ar",
    "Cabo de Acelerador", "Bateria", "Combustível",
  ],
  appColors: {},
  reserveInWeeklyGoal: false,
  weeklyGoalMode: "next",
  currentMotoKm: 0,
  roloInitialBalance: 0,
};

// ==================== GENERIC CRUD ====================

async function getAll<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function saveAll<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ==================== MOTO EARNINGS ====================
export const MotoEarningsDB = {
  getAll: () => getAll<MotoEarning>(KEYS.MOTO_EARNINGS),
  add: async (earning: Omit<MotoEarning, "id" | "createdAt">): Promise<MotoEarning> => {
    const items = await getAll<MotoEarning>(KEYS.MOTO_EARNINGS);
    const newItem: MotoEarning = { ...earning, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.MOTO_EARNINGS, items);
    return newItem;
  },
  update: async (id: string, data: Partial<MotoEarning>): Promise<void> => {
    const items = await getAll<MotoEarning>(KEYS.MOTO_EARNINGS);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.MOTO_EARNINGS, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<MotoEarning>(KEYS.MOTO_EARNINGS);
    await saveAll(KEYS.MOTO_EARNINGS, items.filter((i) => i.id !== id));
  },
};

// ==================== DAILY KM ====================
export const DailyKmDB = {
  getAll: () => getAll<DailyKm>(KEYS.DAILY_KM),
  add: async (entry: Omit<DailyKm, "id" | "createdAt">): Promise<DailyKm> => {
    const items = await getAll<DailyKm>(KEYS.DAILY_KM);
    const existingIndex = items.findIndex((i) => i.date === entry.date);
    if (existingIndex >= 0) { items[existingIndex].km = entry.km; await saveAll(KEYS.DAILY_KM, items); return items[existingIndex]; }
    const newItem: DailyKm = { ...entry, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.DAILY_KM, items);
    return newItem;
  },
  update: async (id: string, data: Partial<DailyKm>): Promise<void> => {
    const items = await getAll<DailyKm>(KEYS.DAILY_KM);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.DAILY_KM, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<DailyKm>(KEYS.DAILY_KM);
    await saveAll(KEYS.DAILY_KM, items.filter((i) => i.id !== id));
  },
};

// ==================== MAINTENANCE ====================
export const MaintenanceDB = {
  getAll: () => getAll<Maintenance>(KEYS.MAINTENANCE),
  add: async (item: Omit<Maintenance, "id" | "createdAt">): Promise<Maintenance> => {
    const items = await getAll<Maintenance>(KEYS.MAINTENANCE);
    const newItem: Maintenance = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.MAINTENANCE, items);
    return newItem;
  },
  update: async (id: string, data: Partial<Maintenance>): Promise<void> => {
    const items = await getAll<Maintenance>(KEYS.MAINTENANCE);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.MAINTENANCE, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<Maintenance>(KEYS.MAINTENANCE);
    await saveAll(KEYS.MAINTENANCE, items.filter((i) => i.id !== id));
  },
};

// ==================== MAINTENANCE FORECAST ====================
export const MaintenanceForecastDB = {
  getAll: () => getAll<MaintenanceForecast>(KEYS.MAINTENANCE_FORECAST),
  add: async (item: Omit<MaintenanceForecast, "id" | "createdAt">): Promise<MaintenanceForecast> => {
    const items = await getAll<MaintenanceForecast>(KEYS.MAINTENANCE_FORECAST);
    const newItem: MaintenanceForecast = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.MAINTENANCE_FORECAST, items);
    return newItem;
  },
  update: async (id: string, data: Partial<MaintenanceForecast>): Promise<void> => {
    const items = await getAll<MaintenanceForecast>(KEYS.MAINTENANCE_FORECAST);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.MAINTENANCE_FORECAST, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<MaintenanceForecast>(KEYS.MAINTENANCE_FORECAST);
    await saveAll(KEYS.MAINTENANCE_FORECAST, items.filter((i) => i.id !== id));
  },
};

// ==================== FINANCIAL ENTRIES ====================
export const FinancialDB = {
  getAll: () => getAll<FinancialEntry>(KEYS.FINANCIAL_ENTRIES),
  add: async (entry: Omit<FinancialEntry, "id" | "createdAt">): Promise<FinancialEntry> => {
    const items = await getAll<FinancialEntry>(KEYS.FINANCIAL_ENTRIES);
    const newItem: FinancialEntry = { ...entry, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    if (entry.isInstallment && entry.installmentTotal && entry.installmentTotal > 1) {
      const groupId = newItem.id;
      newItem.installmentGroupId = groupId;
      newItem.installmentCurrent = 1;
      const periodValue = entry.value / entry.installmentTotal;
      const installPeriod = entry.installmentPeriod || "month";
      for (let i = 2; i <= entry.installmentTotal; i++) {
        const futureDate = new Date(entry.date);
        if (installPeriod === "week") { futureDate.setDate(futureDate.getDate() + (i - 1) * 7); }
        else { futureDate.setMonth(futureDate.getMonth() + (i - 1)); }
        items.push({ ...entry, id: generateId(), value: periodValue, dueDate: futureDate.toISOString().split("T")[0], installmentCurrent: i, installmentGroupId: groupId, installmentPeriod: installPeriod, isPaid: false, createdAt: new Date().toISOString() });
      }
      newItem.value = periodValue;
    }
    await saveAll(KEYS.FINANCIAL_ENTRIES, items);
    return newItem;
  },
  update: async (id: string, data: Partial<FinancialEntry>): Promise<void> => {
    const items = await getAll<FinancialEntry>(KEYS.FINANCIAL_ENTRIES);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.FINANCIAL_ENTRIES, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<FinancialEntry>(KEYS.FINANCIAL_ENTRIES);
    await saveAll(KEYS.FINANCIAL_ENTRIES, items.filter((i) => i.id !== id));
  },
  removeInstallmentGroup: async (id: string): Promise<void> => {
    const items = await getAll<FinancialEntry>(KEYS.FINANCIAL_ENTRIES);
    const target = items.find((i) => i.id === id);
    if (!target || !target.isInstallment) {
      await saveAll(KEYS.FINANCIAL_ENTRIES, items.filter((i) => i.id !== id));
      return;
    }
    const groupId = target.installmentGroupId;
    const baseDesc = target.description.replace(/\s*\(\d+\/\d+\)\s*$/, "");
    const filtered = items.filter((i) => {
      if (i.id === id) return false;
      if (groupId && i.installmentGroupId === groupId) return false;
      if (i.isInstallment && i.description.replace(/\s*\(\d+\/\d+\)\s*$/, "") === baseDesc) return false;
      return true;
    });
    await saveAll(KEYS.FINANCIAL_ENTRIES, filtered);
  },
  removeInstallmentFuture: async (id: string): Promise<void> => {
    const items = await getAll<FinancialEntry>(KEYS.FINANCIAL_ENTRIES);
    const target = items.find((i) => i.id === id);
    if (!target || !target.isInstallment) {
      await saveAll(KEYS.FINANCIAL_ENTRIES, items.filter((i) => i.id !== id));
      return;
    }
    const groupId = target.installmentGroupId;
    const baseDesc = target.description.replace(/\s*\(\d+\/\d+\)\s*$/, "");
    const targetDue = new Date(target.dueDate || target.date);
    const filtered = items.filter((i) => {
      if (i.id === id) return false;
      const sameGroup = (groupId && i.installmentGroupId === groupId) ||
        (i.isInstallment && i.description.replace(/\s*\(\d+\/\d+\)\s*$/, "") === baseDesc);
      if (!sameGroup) return true;
      const iDue = new Date(i.dueDate || i.date);
      return iDue < targetDue;
    });
    await saveAll(KEYS.FINANCIAL_ENTRIES, filtered);
  },
};

// ==================== MONTHLY BILLS ====================
export const MonthlyBillsDB = {
  getAll: () => getAll<MonthlyBill>(KEYS.MONTHLY_BILLS),
  add: async (item: Omit<MonthlyBill, "id" | "createdAt">): Promise<MonthlyBill> => {
    const items = await getAll<MonthlyBill>(KEYS.MONTHLY_BILLS);
    const newItem: MonthlyBill = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.MONTHLY_BILLS, items);
    return newItem;
  },
  update: async (id: string, data: Partial<MonthlyBill>): Promise<void> => {
    const items = await getAll<MonthlyBill>(KEYS.MONTHLY_BILLS);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.MONTHLY_BILLS, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<MonthlyBill>(KEYS.MONTHLY_BILLS);
    await saveAll(KEYS.MONTHLY_BILLS, items.filter((i) => i.id !== id));
  },
};

// ==================== INVESTMENTS ====================
export const InvestmentDB = {
  getAll: () => getAll<Investment>(KEYS.INVESTMENTS),
  add: async (item: Omit<Investment, "id" | "createdAt">): Promise<Investment> => {
    const items = await getAll<Investment>(KEYS.INVESTMENTS);
    const newItem: Investment = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.INVESTMENTS, items);
    return newItem;
  },
  update: async (id: string, data: Partial<Investment>): Promise<void> => {
    const items = await getAll<Investment>(KEYS.INVESTMENTS);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.INVESTMENTS, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<Investment>(KEYS.INVESTMENTS);
    await saveAll(KEYS.INVESTMENTS, items.filter((i) => i.id !== id));
  },
};

// ==================== EXTRA INCOME ====================
export const ExtraIncomeDB = {
  getAll: () => getAll<ExtraIncome>(KEYS.EXTRA_INCOME),
  add: async (item: Omit<ExtraIncome, "id" | "createdAt">): Promise<ExtraIncome> => {
    const items = await getAll<ExtraIncome>(KEYS.EXTRA_INCOME);
    const newItem: ExtraIncome = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.EXTRA_INCOME, items);
    return newItem;
  },
  update: async (id: string, data: Partial<ExtraIncome>): Promise<void> => {
    const items = await getAll<ExtraIncome>(KEYS.EXTRA_INCOME);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.EXTRA_INCOME, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<ExtraIncome>(KEYS.EXTRA_INCOME);
    await saveAll(KEYS.EXTRA_INCOME, items.filter((i) => i.id !== id));
  },
};

// ==================== WALLET TRANSACTIONS ====================
export const WalletTransactionDB = {
  getAll: () => getAll<WalletTransaction>(KEYS.WALLET_TRANSACTIONS),
  add: async (item: Omit<WalletTransaction, "id" | "createdAt">): Promise<WalletTransaction> => {
    const items = await getAll<WalletTransaction>(KEYS.WALLET_TRANSACTIONS);
    const newItem: WalletTransaction = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.WALLET_TRANSACTIONS, items);
    return newItem;
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<WalletTransaction>(KEYS.WALLET_TRANSACTIONS);
    await saveAll(KEYS.WALLET_TRANSACTIONS, items.filter((i) => i.id !== id));
  },
};

// ==================== WEEKLY KM COSTS ====================
export const WeeklyKmCostDB = {
  getAll: () => getAll<WeeklyKmCost>(KEYS.WEEKLY_KM_COSTS),
  add: async (item: Omit<WeeklyKmCost, "id" | "createdAt">): Promise<WeeklyKmCost> => {
    const items = await getAll<WeeklyKmCost>(KEYS.WEEKLY_KM_COSTS);
    const newItem: WeeklyKmCost = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.WEEKLY_KM_COSTS, items);
    return newItem;
  },
  update: async (id: string, data: Partial<WeeklyKmCost>): Promise<void> => {
    const items = await getAll<WeeklyKmCost>(KEYS.WEEKLY_KM_COSTS);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.WEEKLY_KM_COSTS, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<WeeklyKmCost>(KEYS.WEEKLY_KM_COSTS);
    await saveAll(KEYS.WEEKLY_KM_COSTS, items.filter((i) => i.id !== id));
  },
};

// ==================== ROLO PRODUCTS ====================
export const RoloProductDB = {
  getAll: () => getAll<RoloProduct>(KEYS.ROLO_PRODUCTS),
  add: async (item: Omit<RoloProduct, "id" | "createdAt">): Promise<RoloProduct> => {
    const items = await getAll<RoloProduct>(KEYS.ROLO_PRODUCTS);
    const existingIndex = items.findIndex(
      (p) => p.name.toLowerCase().trim() === item.name.toLowerCase().trim()
    );
    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const totalQty = existing.quantity + item.quantity;
      const avgPrice =
        (existing.purchasePrice * existing.quantity + item.purchasePrice * item.quantity) / totalQty;
      items[existingIndex] = {
        ...existing,
        quantity: totalQty,
        purchasePrice: avgPrice,
        suggestedSalePrice: item.suggestedSalePrice || existing.suggestedSalePrice,
        profitMargin: item.profitMargin || existing.profitMargin,
      };
      await saveAll(KEYS.ROLO_PRODUCTS, items);
      return items[existingIndex];
    }
    const newItem: RoloProduct = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.ROLO_PRODUCTS, items);
    return newItem;
  },
  update: async (id: string, data: Partial<RoloProduct>): Promise<void> => {
    const items = await getAll<RoloProduct>(KEYS.ROLO_PRODUCTS);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.ROLO_PRODUCTS, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<RoloProduct>(KEYS.ROLO_PRODUCTS);
    await saveAll(KEYS.ROLO_PRODUCTS, items.filter((i) => i.id !== id));
  },
};

// ==================== ROLO SALES ====================
export const RoloSaleDB = {
  getAll: () => getAll<RoloSale>(KEYS.ROLO_SALES),
  add: async (item: Omit<RoloSale, "id" | "createdAt">): Promise<RoloSale> => {
    const items = await getAll<RoloSale>(KEYS.ROLO_SALES);
    const newItem: RoloSale = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.ROLO_SALES, items);
    return newItem;
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<RoloSale>(KEYS.ROLO_SALES);
    await saveAll(KEYS.ROLO_SALES, items.filter((i) => i.id !== id));
  },
};

// ==================== ROLO WITHDRAWALS ====================
export const RoloWithdrawalDB = {
  getAll: () => getAll<RoloWithdrawal>(KEYS.ROLO_WITHDRAWALS),
  add: async (item: Omit<RoloWithdrawal, "id" | "createdAt">): Promise<RoloWithdrawal> => {
    const items = await getAll<RoloWithdrawal>(KEYS.ROLO_WITHDRAWALS);
    const newItem: RoloWithdrawal = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.ROLO_WITHDRAWALS, items);
    return newItem;
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<RoloWithdrawal>(KEYS.ROLO_WITHDRAWALS);
    await saveAll(KEYS.ROLO_WITHDRAWALS, items.filter((i) => i.id !== id));
  },
};

// ==================== WORK SHIFTS ====================
export const WorkShiftDB = {
  getAll: () => getAll<WorkShift>(KEYS.WORK_SHIFTS),
  add: async (item: Omit<WorkShift, "id" | "createdAt">): Promise<WorkShift> => {
    const items = await getAll<WorkShift>(KEYS.WORK_SHIFTS);
    const newItem: WorkShift = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    await saveAll(KEYS.WORK_SHIFTS, items);
    return newItem;
  },
  update: async (id: string, data: Partial<WorkShift>): Promise<void> => {
    const items = await getAll<WorkShift>(KEYS.WORK_SHIFTS);
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) { items[index] = { ...items[index], ...data }; await saveAll(KEYS.WORK_SHIFTS, items); }
  },
  remove: async (id: string): Promise<void> => {
    const items = await getAll<WorkShift>(KEYS.WORK_SHIFTS);
    await saveAll(KEYS.WORK_SHIFTS, items.filter((i) => i.id !== id));
  },
};

// ==================== CONFIG ====================
export const ConfigDB = {
  get: async (): Promise<AppConfig> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.CONFIG);
      return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  },
  save: async (config: Partial<AppConfig>): Promise<void> => {
    const current = await ConfigDB.get();
    await AsyncStorage.setItem(KEYS.CONFIG, JSON.stringify({ ...current, ...config }));
  },
};

// ==================== BACKUP / RESTORE / CLEAR ====================
export const BackupDB = {
  exportAll: async (): Promise<string> => {
    const [earnings, dailyKm, maintenance, forecasts, financials, monthlyBills, investments, extraIncome, walletTx, weeklyKm, roloProducts, roloSales, roloWithdrawals, workShifts, config] =
      await Promise.all([
        MotoEarningsDB.getAll(), DailyKmDB.getAll(), MaintenanceDB.getAll(),
        MaintenanceForecastDB.getAll(), FinancialDB.getAll(), MonthlyBillsDB.getAll(),
        InvestmentDB.getAll(), ExtraIncomeDB.getAll(), WalletTransactionDB.getAll(),
        WeeklyKmCostDB.getAll(), RoloProductDB.getAll(), RoloSaleDB.getAll(),
        RoloWithdrawalDB.getAll(), WorkShiftDB.getAll(), ConfigDB.get(),
      ]);
    return JSON.stringify({
      version: "1.3.0",
      exportDate: new Date().toISOString(),
      data: {
        earnings, dailyKm, maintenance, forecasts, financials, monthlyBills,
        investments, extraIncome, walletTransactions: walletTx, weeklyKmCosts: weeklyKm,
        roloProducts, roloSales, roloWithdrawals, workShifts, config,
      },
    }, null, 2);
  },
  importAll: async (jsonStr: string): Promise<boolean> => {
    try {
      const backup = JSON.parse(jsonStr);
      const d = backup.data;
      if (!d) return false;
      await Promise.all([
        d.earnings ? saveAll(KEYS.MOTO_EARNINGS, d.earnings) : Promise.resolve(),
        d.dailyKm ? saveAll(KEYS.DAILY_KM, d.dailyKm) : Promise.resolve(),
        d.maintenance ? saveAll(KEYS.MAINTENANCE, d.maintenance) : Promise.resolve(),
        d.forecasts ? saveAll(KEYS.MAINTENANCE_FORECAST, d.forecasts) : Promise.resolve(),
        d.financials ? saveAll(KEYS.FINANCIAL_ENTRIES, d.financials) : Promise.resolve(),
        d.monthlyBills ? saveAll(KEYS.MONTHLY_BILLS, d.monthlyBills) : Promise.resolve(),
        d.investments ? saveAll(KEYS.INVESTMENTS, d.investments) : Promise.resolve(),
        d.extraIncome ? saveAll(KEYS.EXTRA_INCOME, d.extraIncome) : Promise.resolve(),
        d.walletTransactions ? saveAll(KEYS.WALLET_TRANSACTIONS, d.walletTransactions) : Promise.resolve(),
        d.weeklyKmCosts ? saveAll(KEYS.WEEKLY_KM_COSTS, d.weeklyKmCosts) : Promise.resolve(),
        d.roloProducts ? saveAll(KEYS.ROLO_PRODUCTS, d.roloProducts) : Promise.resolve(),
        d.roloSales ? saveAll(KEYS.ROLO_SALES, d.roloSales) : Promise.resolve(),
        d.roloWithdrawals ? saveAll(KEYS.ROLO_WITHDRAWALS, d.roloWithdrawals) : Promise.resolve(),
        d.workShifts ? saveAll(KEYS.WORK_SHIFTS, d.workShifts) : Promise.resolve(),
        d.config ? AsyncStorage.setItem(KEYS.CONFIG, JSON.stringify(d.config)) : Promise.resolve(),
      ]);
      return true;
    } catch { return false; }
  },
  clearAll: async (): Promise<void> => {
    await Promise.all(Object.values(KEYS).map((key) => AsyncStorage.removeItem(key)));
  },
};
