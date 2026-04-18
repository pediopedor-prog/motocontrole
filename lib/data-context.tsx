import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  MotoEarningsDB, DailyKmDB, MaintenanceDB, MaintenanceForecastDB,
  FinancialDB, MonthlyBillsDB, InvestmentDB, ExtraIncomeDB,
  WalletTransactionDB, WeeklyKmCostDB,
  RoloProductDB, RoloSaleDB, RoloWithdrawalDB,
  WorkShiftDB,
  ConfigDB, BackupDB, DEFAULT_CONFIG,
  type MotoEarning, type DailyKm, type Maintenance, type MaintenanceForecast,
  type FinancialEntry, type MonthlyBill, type Investment, type ExtraIncome,
  type AppConfig, type WalletTransaction, type WeeklyKmCost,
  type RoloProduct, type RoloSale, type RoloWithdrawal,
  type WorkShift,
} from "./database";

interface DataContextType {
  earnings: MotoEarning[];
  dailyKms: DailyKm[];
  maintenance: Maintenance[];
  forecasts: MaintenanceForecast[];
  financials: FinancialEntry[];
  monthlyBills: MonthlyBill[];
  investments: Investment[];
  extraIncomes: ExtraIncome[];
  walletTransactions: WalletTransaction[];
  weeklyKmCosts: WeeklyKmCost[];
  roloProducts: RoloProduct[];
  roloSales: RoloSale[];
  roloWithdrawals: RoloWithdrawal[];
  workShifts: WorkShift[];
  config: AppConfig;
  loading: boolean;

  refresh: () => Promise<void>;

  addEarning: (e: Omit<MotoEarning, "id" | "createdAt">) => Promise<void>;
  updateEarning: (id: string, data: Partial<MotoEarning>) => Promise<void>;
  removeEarning: (id: string) => Promise<void>;

  addDailyKm: (e: Omit<DailyKm, "id" | "createdAt">) => Promise<void>;
  updateDailyKm: (id: string, data: Partial<DailyKm>) => Promise<void>;
  removeDailyKm: (id: string) => Promise<void>;

  addMaintenance: (m: Omit<Maintenance, "id" | "createdAt">) => Promise<void>;
  updateMaintenance: (id: string, data: Partial<Maintenance>) => Promise<void>;
  removeMaintenance: (id: string) => Promise<void>;

  addForecast: (f: Omit<MaintenanceForecast, "id" | "createdAt">) => Promise<void>;
  updateForecast: (id: string, data: Partial<MaintenanceForecast>) => Promise<void>;
  removeForecast: (id: string) => Promise<void>;

  addFinancial: (f: Omit<FinancialEntry, "id" | "createdAt">) => Promise<void>;
  updateFinancial: (id: string, data: Partial<FinancialEntry>) => Promise<void>;
  removeFinancial: (id: string) => Promise<void>;
  removeFinancialInstallmentGroup: (id: string) => Promise<void>;
  removeFinancialInstallmentFuture: (id: string) => Promise<void>;

  addMonthlyBill: (b: Omit<MonthlyBill, "id" | "createdAt">) => Promise<void>;
  updateMonthlyBill: (id: string, data: Partial<MonthlyBill>) => Promise<void>;
  removeMonthlyBill: (id: string) => Promise<void>;

  addInvestment: (i: Omit<Investment, "id" | "createdAt">) => Promise<void>;
  updateInvestment: (id: string, data: Partial<Investment>) => Promise<void>;
  removeInvestment: (id: string) => Promise<void>;

  addExtraIncome: (i: Omit<ExtraIncome, "id" | "createdAt">) => Promise<void>;
  updateExtraIncome: (id: string, data: Partial<ExtraIncome>) => Promise<void>;
  removeExtraIncome: (id: string) => Promise<void>;

  addWalletTransaction: (t: Omit<WalletTransaction, "id" | "createdAt">) => Promise<void>;
  removeWalletTransaction: (id: string) => Promise<void>;

  addWeeklyKmCost: (w: Omit<WeeklyKmCost, "id" | "createdAt">) => Promise<void>;
  updateWeeklyKmCost: (id: string, data: Partial<WeeklyKmCost>) => Promise<void>;
  removeWeeklyKmCost: (id: string) => Promise<void>;

  addRoloProduct: (p: Omit<RoloProduct, "id" | "createdAt">) => Promise<void>;
  updateRoloProduct: (id: string, data: Partial<RoloProduct>) => Promise<void>;
  removeRoloProduct: (id: string) => Promise<void>;

  addRoloSale: (s: Omit<RoloSale, "id" | "createdAt">) => Promise<void>;
  removeRoloSale: (id: string) => Promise<void>;

  addRoloWithdrawal: (w: Omit<RoloWithdrawal, "id" | "createdAt">) => Promise<void>;
  removeRoloWithdrawal: (id: string) => Promise<void>;

  addWorkShift: (s: Omit<WorkShift, "id" | "createdAt">) => Promise<void>;
  updateWorkShift: (id: string, data: Partial<WorkShift>) => Promise<void>;
  removeWorkShift: (id: string) => Promise<void>;

  saveConfig: (c: Partial<AppConfig>) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (jsonStr: string) => Promise<boolean>;
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [earnings, setEarnings] = useState<MotoEarning[]>([]);
  const [dailyKms, setDailyKms] = useState<DailyKm[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [forecasts, setForecasts] = useState<MaintenanceForecast[]>([]);
  const [financials, setFinancials] = useState<FinancialEntry[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [extraIncomes, setExtraIncomes] = useState<ExtraIncome[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [weeklyKmCosts, setWeeklyKmCosts] = useState<WeeklyKmCost[]>([]);
  const [roloProducts, setRoloProducts] = useState<RoloProduct[]>([]);
  const [roloSales, setRoloSales] = useState<RoloSale[]>([]);
  const [roloWithdrawals, setRoloWithdrawals] = useState<RoloWithdrawal[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [e, dk, m, f, fi, mb, inv, ei, wt, wk, rp, rs, rw, ws, c] = await Promise.all([
      MotoEarningsDB.getAll(), DailyKmDB.getAll(), MaintenanceDB.getAll(),
      MaintenanceForecastDB.getAll(), FinancialDB.getAll(), MonthlyBillsDB.getAll(),
      InvestmentDB.getAll(), ExtraIncomeDB.getAll(), WalletTransactionDB.getAll(),
      WeeklyKmCostDB.getAll(), RoloProductDB.getAll(), RoloSaleDB.getAll(),
      RoloWithdrawalDB.getAll(), WorkShiftDB.getAll(), ConfigDB.get(),
    ]);
    setEarnings(e); setDailyKms(dk); setMaintenance(m); setForecasts(f);
    setFinancials(fi); setMonthlyBills(mb); setInvestments(inv); setExtraIncomes(ei);
    setWalletTransactions(wt); setWeeklyKmCosts(wk);
    setRoloProducts(rp); setRoloSales(rs); setRoloWithdrawals(rw);
    setWorkShifts(ws);
    setConfig(c); setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const autoReplicateRan = useRef(false);
  useEffect(() => {
    if (loading || autoReplicateRan.current) return;
    autoReplicateRan.current = true;
    const autoReplicate = async () => {
      const allFinancials = await FinancialDB.getAll();
      const now = new Date();
      let changed = false;

      const fixedMonthly = allFinancials.filter((f) => f.isFixed && f.fixedPeriod === "monthly");
      const monthlyTemplates: Record<string, typeof fixedMonthly[0]> = {};
      fixedMonthly.forEach((f) => {
        const key = f.description;
        if (!monthlyTemplates[key]) monthlyTemplates[key] = f;
      });

      for (const bill of Object.values(monthlyTemplates)) {
        const dueDateStr = bill.dueDate || bill.date;
        const parts = dueDateStr.split("-");
        const originalDay = parseInt(parts[2], 10);
        for (let offset = 0; offset <= 11; offset++) {
          const totalMonths = now.getMonth() + offset;
          const targetYear = now.getFullYear() + Math.floor(totalMonths / 12);
          const targetMonth = totalMonths % 12;
          const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();
          const day = Math.min(originalDay, maxDay);
          const targetDueStr = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const exists = allFinancials.some((f) => {
            const fDate = f.dueDate || f.date;
            const fParts = fDate.split("-");
            return (
              f.description === bill.description &&
              f.isFixed && f.fixedPeriod === "monthly" &&
              parseInt(fParts[0]) === targetYear &&
              parseInt(fParts[1]) - 1 === targetMonth
            );
          });
          if (!exists) {
            const newItem = await FinancialDB.add({
              type: bill.type, description: bill.description, value: bill.value,
              category: bill.category, date: targetDueStr, dueDate: targetDueStr,
              isPaid: false, isFixed: true, fixedPeriod: "monthly", isInstallment: false,
            });
            allFinancials.push(newItem);
            changed = true;
          }
        }
      }

      const fixedWeekly = allFinancials.filter((f) => f.isFixed && f.fixedPeriod === "weekly");
      const weeklyTemplates: Record<string, typeof fixedWeekly[0]> = {};
      fixedWeekly.forEach((f) => { if (!weeklyTemplates[f.description]) weeklyTemplates[f.description] = f; });

      for (const bill of Object.values(weeklyTemplates)) {
        const dueDateStr = bill.dueDate || bill.date;
        const billDue = new Date(dueDateStr + "T12:00:00");
        const dayOfWeek = billDue.getDay();
        for (let weekOffset = 0; weekOffset <= 51; weekOffset++) {
          const refDate = new Date(now);
          refDate.setDate(refDate.getDate() + weekOffset * 7);
          const currentDay = refDate.getDay();
          const diff = dayOfWeek - currentDay;
          const targetDate = new Date(refDate);
          targetDate.setDate(targetDate.getDate() + diff);
          const targetStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;
          const exists = allFinancials.some((f) =>
            f.description === bill.description && f.isFixed && f.fixedPeriod === "weekly" &&
            (f.dueDate || f.date) === targetStr
          );
          if (!exists && targetDate >= billDue) {
            const newItem = await FinancialDB.add({
              type: bill.type, description: bill.description, value: bill.value,
              category: bill.category, date: targetStr, dueDate: targetStr,
              isPaid: false, isFixed: true, fixedPeriod: "weekly", isInstallment: false,
            });
            allFinancials.push(newItem);
            changed = true;
          }
        }
      }

      if (changed) await refresh();
    };
    autoReplicate();
  }, [loading, financials, refresh]);

  // Earnings
  const addEarning = useCallback(async (e: Omit<MotoEarning, "id" | "createdAt">) => {
    const paymentConfigs = config.appPaymentConfigs || [];
    const appConfig = paymentConfigs.find((p) => p.appName === e.appName);
    if (appConfig && appConfig.paymentMode === "instant") {
      const today = new Date().toISOString().split("T")[0];
      await MotoEarningsDB.add({ ...e, status: "received", receivedValue: e.value, receivedDate: today });
    } else {
      await MotoEarningsDB.add(e);
    }
    await refresh();
  }, [refresh, config.appPaymentConfigs]);

  const updateEarning = useCallback(async (id: string, data: Partial<MotoEarning>) => {
    await MotoEarningsDB.update(id, data); await refresh();
  }, [refresh]);
  const removeEarning = useCallback(async (id: string) => {
    await MotoEarningsDB.remove(id); await refresh();
  }, [refresh]);

  // Daily KM
  const addDailyKm = useCallback(async (e: Omit<DailyKm, "id" | "createdAt">) => {
    await DailyKmDB.add(e); await refresh();
  }, [refresh]);
  const updateDailyKm = useCallback(async (id: string, data: Partial<DailyKm>) => {
    await DailyKmDB.update(id, data); await refresh();
  }, [refresh]);
  const removeDailyKm = useCallback(async (id: string) => {
    await DailyKmDB.remove(id); await refresh();
  }, [refresh]);

  // Maintenance
  const addMaintenance = useCallback(async (m: Omit<Maintenance, "id" | "createdAt">) => {
    await MaintenanceDB.add(m);
    await FinancialDB.add({
      type: "expense", category: "Manutenção Moto",
      description: `Manutenção: ${m.item}${m.location ? ` - ${m.location}` : ""}`,
      value: m.value, date: m.date, isPaid: true, isFixed: false, isInstallment: false,
    });
    const currentConfig = await ConfigDB.get();
    const motoWallet = (currentConfig.wallets || []).find((w: any) => w.name === "Moto" || w.id === "wallet_moto");
    if (motoWallet) {
      await WalletTransactionDB.add({
        walletId: motoWallet.id, type: "withdrawal", value: m.value,
        description: `Manutenção: ${m.item}`, date: m.date,
      });
    }
    await refresh();
  }, [refresh]);

  const updateMaintenance = useCallback(async (id: string, data: Partial<Maintenance>) => {
    await MaintenanceDB.update(id, data); await refresh();
  }, [refresh]);

  const removeMaintenance = useCallback(async (id: string) => {
    const allMaint = await MaintenanceDB.getAll();
    const maintItem = allMaint.find((m) => m.id === id);
    await MaintenanceDB.remove(id);
    if (maintItem) {
      const allFinancials = await FinancialDB.getAll();
      const matchingFinancial = allFinancials.find((f) =>
        f.category === "Manutenção Moto" && f.description.includes(maintItem.item) &&
        Math.abs(f.value - maintItem.value) < 0.01 && f.date === maintItem.date
      );
      if (matchingFinancial) await FinancialDB.remove(matchingFinancial.id);
      const allWalletTx = await WalletTransactionDB.getAll();
      const matchingWalletTx = allWalletTx.find((t) =>
        t.type === "withdrawal" && t.description.includes(maintItem.item) &&
        Math.abs(t.value - maintItem.value) < 0.01
      );
      if (matchingWalletTx) await WalletTransactionDB.remove(matchingWalletTx.id);
    }
    await refresh();
  }, [refresh]);

  // Forecasts
  const addForecast = useCallback(async (f: Omit<MaintenanceForecast, "id" | "createdAt">) => {
    await MaintenanceForecastDB.add(f); await refresh();
  }, [refresh]);
  const updateForecast = useCallback(async (id: string, data: Partial<MaintenanceForecast>) => {
    await MaintenanceForecastDB.update(id, data); await refresh();
  }, [refresh]);
  const removeForecast = useCallback(async (id: string) => {
    await MaintenanceForecastDB.remove(id); await refresh();
  }, [refresh]);

  // Financial
  const addFinancial = useCallback(async (f: Omit<FinancialEntry, "id" | "createdAt">) => {
    await FinancialDB.add(f);
    if (f.isFixed) autoReplicateRan.current = false;
    await refresh();
  }, [refresh]);
  const updateFinancial = useCallback(async (id: string, data: Partial<FinancialEntry>) => {
    await FinancialDB.update(id, data); await refresh();
  }, [refresh]);
  const removeFinancial = useCallback(async (id: string) => {
    await FinancialDB.remove(id); await refresh();
  }, [refresh]);
  const removeFinancialInstallmentGroup = useCallback(async (id: string) => {
    await FinancialDB.removeInstallmentGroup(id); await refresh();
  }, [refresh]);
  const removeFinancialInstallmentFuture = useCallback(async (id: string) => {
    await FinancialDB.removeInstallmentFuture(id); await refresh();
  }, [refresh]);

  // Monthly Bills
  const addMonthlyBill = useCallback(async (b: Omit<MonthlyBill, "id" | "createdAt">) => {
    await MonthlyBillsDB.add(b); await refresh();
  }, [refresh]);
  const updateMonthlyBill = useCallback(async (id: string, data: Partial<MonthlyBill>) => {
    await MonthlyBillsDB.update(id, data); await refresh();
  }, [refresh]);
  const removeMonthlyBill = useCallback(async (id: string) => {
    await MonthlyBillsDB.remove(id); await refresh();
  }, [refresh]);

  // Investments
  const addInvestment = useCallback(async (i: Omit<Investment, "id" | "createdAt">) => {
    await InvestmentDB.add(i); await refresh();
  }, [refresh]);
  const updateInvestment = useCallback(async (id: string, data: Partial<Investment>) => {
    await InvestmentDB.update(id, data); await refresh();
  }, [refresh]);
  const removeInvestment = useCallback(async (id: string) => {
    await InvestmentDB.remove(id); await refresh();
  }, [refresh]);

  // Extra Income
  const addExtraIncome = useCallback(async (i: Omit<ExtraIncome, "id" | "createdAt">) => {
    await ExtraIncomeDB.add(i); await refresh();
  }, [refresh]);
  const updateExtraIncome = useCallback(async (id: string, data: Partial<ExtraIncome>) => {
    await ExtraIncomeDB.update(id, data); await refresh();
  }, [refresh]);
  const removeExtraIncome = useCallback(async (id: string) => {
    await ExtraIncomeDB.remove(id); await refresh();
  }, [refresh]);

  // Wallet Transactions
  const addWalletTransaction = useCallback(async (t: Omit<WalletTransaction, "id" | "createdAt">) => {
    await WalletTransactionDB.add(t); await refresh();
  }, [refresh]);
  const removeWalletTransaction = useCallback(async (id: string) => {
    await WalletTransactionDB.remove(id); await refresh();
  }, [refresh]);

  // Weekly KM Costs
  const addWeeklyKmCost = useCallback(async (w: Omit<WeeklyKmCost, "id" | "createdAt">) => {
    await WeeklyKmCostDB.add(w); await refresh();
  }, [refresh]);
  const updateWeeklyKmCost = useCallback(async (id: string, data: Partial<WeeklyKmCost>) => {
    await WeeklyKmCostDB.update(id, data); await refresh();
  }, [refresh]);
  const removeWeeklyKmCost = useCallback(async (id: string) => {
    await WeeklyKmCostDB.remove(id); await refresh();
  }, [refresh]);

  // Rolo Products
  const addRoloProduct = useCallback(async (p: Omit<RoloProduct, "id" | "createdAt">) => {
    await RoloProductDB.add(p); await refresh();
  }, [refresh]);
  const updateRoloProduct = useCallback(async (id: string, data: Partial<RoloProduct>) => {
    await RoloProductDB.update(id, data); await refresh();
  }, [refresh]);
  const removeRoloProduct = useCallback(async (id: string) => {
    await RoloProductDB.remove(id); await refresh();
  }, [refresh]);

  // Rolo Sales
  const addRoloSale = useCallback(async (s: Omit<RoloSale, "id" | "createdAt">) => {
    await RoloSaleDB.add(s); await refresh();
  }, [refresh]);
  const removeRoloSale = useCallback(async (id: string) => {
    await RoloSaleDB.remove(id); await refresh();
  }, [refresh]);

  // Rolo Withdrawals
  const addRoloWithdrawal = useCallback(async (w: Omit<RoloWithdrawal, "id" | "createdAt">) => {
    await RoloWithdrawalDB.add(w); await refresh();
  }, [refresh]);
  const removeRoloWithdrawal = useCallback(async (id: string) => {
    await RoloWithdrawalDB.remove(id); await refresh();
  }, [refresh]);

  // Work Shifts
  const addWorkShift = useCallback(async (s: Omit<WorkShift, "id" | "createdAt">) => {
    await WorkShiftDB.add(s); await refresh();
  }, [refresh]);
  const updateWorkShift = useCallback(async (id: string, data: Partial<WorkShift>) => {
    await WorkShiftDB.update(id, data); await refresh();
  }, [refresh]);
  const removeWorkShift = useCallback(async (id: string) => {
    await WorkShiftDB.remove(id); await refresh();
  }, [refresh]);

  // Config
  const saveConfig = useCallback(async (c: Partial<AppConfig>) => {
    await ConfigDB.save(c); await refresh();
  }, [refresh]);

  // Backup
  const exportData = useCallback(async () => BackupDB.exportAll(), []);
  const importData = useCallback(async (jsonStr: string) => {
    const result = await BackupDB.importAll(jsonStr);
    if (result) await refresh();
    return result;
  }, [refresh]);
  const clearAllData = useCallback(async () => {
    await BackupDB.clearAll(); await refresh();
  }, [refresh]);

  return (
    <DataContext.Provider value={{
      earnings, dailyKms, maintenance, forecasts, financials, monthlyBills,
      investments, extraIncomes, walletTransactions, weeklyKmCosts,
      roloProducts, roloSales, roloWithdrawals, workShifts,
      config, loading,
      refresh,
      addEarning, updateEarning, removeEarning,
      addDailyKm, updateDailyKm, removeDailyKm,
      addMaintenance, updateMaintenance, removeMaintenance,
      addForecast, updateForecast, removeForecast,
      addFinancial, updateFinancial, removeFinancial,
      removeFinancialInstallmentGroup, removeFinancialInstallmentFuture,
      addMonthlyBill, updateMonthlyBill, removeMonthlyBill,
      addInvestment, updateInvestment, removeInvestment,
      addExtraIncome, updateExtraIncome, removeExtraIncome,
      addWalletTransaction, removeWalletTransaction,
      addWeeklyKmCost, updateWeeklyKmCost, removeWeeklyKmCost,
      addRoloProduct, updateRoloProduct, removeRoloProduct,
      addRoloSale, removeRoloSale,
      addRoloWithdrawal, removeRoloWithdrawal,
      addWorkShift, updateWorkShift, removeWorkShift,
      saveConfig, exportData, importData, clearAllData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
