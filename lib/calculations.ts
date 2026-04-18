import type { MotoEarning, DailyKm, Maintenance, FinancialEntry, Investment, ExtraIncome } from "./database";

// ==================== DATE HELPERS ====================

/** Retorna a data local correta sem problemas de fuso horário */
function getLocalDate(): Date {
  return new Date();
}

/** Retorna string YYYY-MM-DD baseada no fuso local do usuário */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getStartOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function getEndOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function isInRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr + "T12:00:00");
  return d >= start && d <= end;
}

export function formatCurrency(value: number): string {
  // AJUSTE 8.2: Formato 1.000,00 com separador de milhares
  const abs = Math.abs(value);
  const fixed = abs.toFixed(2);
  const parts = fixed.split(".");
  const intPart = parts[0];
  const decPart = parts[1];
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = value < 0 ? "-" : "";
  return `R$ ${sign}${withDots},${decPart}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y.slice(-2)}`;
  }
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return dateStr;
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getFullYear()).slice(-2)}`;
}

export function formatDateInput(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y.slice(-2)}`;
  }
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return dateStr;
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getFullYear()).slice(-2)}`;
}

export function parseDateInput(input: string): string {
  const parts = input.split("/");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    let year = parts[2];
    if (year.length === 2) year = "20" + year;
    return `${year}-${month}-${day}`;
  }
  return input;
}

/** Retorna data de hoje no formato YYYY-MM-DD usando data local */
export function todayStr(): string {
  return toLocalDateStr(getLocalDate());
}

/** Retorna data de hoje formatada DD/MM/AA usando data local */
export function todayFormatted(): string {
  return formatDateInput(todayStr());
}

export function shiftWeek(date: Date, offset: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + offset * 7);
  return d;
}

export function shiftMonth(date: Date, offset: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + offset);
  return d;
}

export function shiftYear(date: Date, offset: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + offset);
  return d;
}

export function formatWeekRange(date: Date): string {
  const start = getStartOfWeek(date);
  const end = getEndOfWeek(date);
  return `${formatDate(toLocalDateStr(start))} - ${formatDate(toLocalDateStr(end))}`;
}

export function formatMonthRange(date: Date): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[date.getMonth()]}/${date.getFullYear()}`;
}

export function formatYearRange(date: Date): string {
  return `${date.getFullYear()}`;
}

// ==================== MOTO CALCULATIONS ====================

/** Calcula total de ganhos recebidos (soma de receivedValue de todos os registros) */
export function calcTotalEarningsReceived(earnings: MotoEarning[], start?: Date, end?: Date): number {
  const filtered = start && end ? earnings.filter((e) => isInRange(e.date, start, end)) : earnings;
  // CORREÇÃO FINAL: Soma receivedValue de TODOS (received + parciais pending)
  return filtered.reduce((sum, e) => sum + (e.receivedValue || 0), 0);
}

/** Calcula total de ganhos - TODOS (para exibição de faturamento bruto) */
export function calcTotalEarnings(earnings: MotoEarning[], start?: Date, end?: Date): number {
  const filtered = start && end ? earnings.filter((e) => isInRange(e.date, start, end)) : earnings;
  return filtered.reduce((sum, e) => sum + e.value, 0);
}

/** Calcula total de ganhos pendentes = totalBruto - totalRecebido */
export function calcTotalEarningsPending(earnings: MotoEarning[], start?: Date, end?: Date): number {
  const filtered = start && end ? earnings.filter((e) => isInRange(e.date, start, end)) : earnings;
  // CORREÇÃO FINAL: Pendente = valor total - valor já recebido (acumulado)
  const totalBruto = filtered.reduce((sum, e) => sum + e.value, 0);
  const totalRecebido = filtered.reduce((sum, e) => sum + (e.receivedValue || 0), 0);
  return totalBruto - totalRecebido;
}

export function calcTotalKm(dailyKms: DailyKm[], start?: Date, end?: Date): number {
  const filtered = start && end ? dailyKms.filter((e) => isInRange(e.date, start, end)) : dailyKms;
  return filtered.reduce((sum, e) => sum + e.km, 0);
}

export function calcAvgPerKm(earnings: MotoEarning[], dailyKms: DailyKm[], start?: Date, end?: Date): number {
  const totalEarnings = calcTotalEarnings(earnings, start, end);
  const totalKm = calcTotalKm(dailyKms, start, end);
  return totalKm > 0 ? totalEarnings / totalKm : 0;
}

export function calcCostPerKm(totalKm: number, costPerKm: number): number {
  return totalKm * costPerKm;
}

/** AJUSTE 1: Lucro Líquido = ganhos - custo KM (SEM deduzir manutenção separadamente) */
export function calcNetProfit(
  earnings: MotoEarning[], dailyKms: DailyKm[], maintenance: Maintenance[],
  costPerKm: number, start?: Date, end?: Date
): number {
  const totalEarnings = calcTotalEarnings(earnings, start, end);
  const totalKm = calcTotalKm(dailyKms, start, end);
  const kmCost = calcCostPerKm(totalKm, costPerKm);
  // AJUSTE 1: Não subtrair manutenção pois já está contemplada no custo por KM
  return totalEarnings - kmCost;
}

export function calcNetProfitNoMaintenance(
  earnings: MotoEarning[], dailyKms: DailyKm[], costPerKm: number, start?: Date, end?: Date
): number {
  const totalEarnings = calcTotalEarnings(earnings, start, end);
  const totalKm = calcTotalKm(dailyKms, start, end);
  const kmCost = calcCostPerKm(totalKm, costPerKm);
  return totalEarnings - kmCost;
}

export function calcMaintenanceCost(maintenance: Maintenance[], start?: Date, end?: Date): number {
  const filtered = start && end ? maintenance.filter((m) => isInRange(m.date, start, end)) : maintenance;
  return filtered.reduce((sum, m) => sum + m.value, 0);
}

// ==================== FINANCIAL CALCULATIONS ====================

export function calcTotalExpenses(entries: FinancialEntry[], start?: Date, end?: Date): number {
  const filtered = start && end
    ? entries.filter((e) => e.type === "expense" && isInRange(e.date, start, end))
    : entries.filter((e) => e.type === "expense");
  return filtered.reduce((sum, e) => sum + e.value, 0);
}

export function calcTotalIncome(entries: FinancialEntry[], start?: Date, end?: Date): number {
  const filtered = start && end
    ? entries.filter((e) => e.type === "income" && isInRange(e.date, start, end))
    : entries.filter((e) => e.type === "income");
  return filtered.reduce((sum, e) => sum + e.value, 0);
}

export function calcUpcomingBills(entries: FinancialEntry[]): FinancialEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return entries.filter((e) => {
    if (e.type !== "expense" || e.isPaid) return false;
    const dueDate = new Date(e.dueDate || e.date);
    return dueDate >= today;
  }).sort((a, b) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime());
}

export function calcOverdueBills(entries: FinancialEntry[]): FinancialEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return entries.filter((e) => {
    if (e.type !== "expense" || e.isPaid) return false;
    const dueDate = new Date(e.dueDate || e.date);
    return dueDate < today;
  });
}

export function calcWeeklyGoal(entries: FinancialEntry[]): { dailyGoal: number; weeklyGoal: number; daysLeft: number } {
  const today = new Date();
  const endOfWeek = getEndOfWeek(today);
  const daysLeft = Math.max(1, Math.ceil((endOfWeek.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const upcoming = calcUpcomingBills(entries);
  const weekBills = upcoming.filter((e) => {
    const due = new Date(e.dueDate || e.date);
    return due <= endOfWeek;
  });
  const totalDue = weekBills.reduce((sum, e) => sum + e.value, 0);
  return { weeklyGoal: totalDue, dailyGoal: totalDue / daysLeft, daysLeft };
}

export function getWeekBills(entries: FinancialEntry[], refDate?: Date): FinancialEntry[] {
  const d = refDate || new Date();
  const start = getStartOfWeek(d);
  const end = getEndOfWeek(d);
  return entries.filter((e) => {
    if (e.type !== "expense") return false;
    const due = new Date(e.dueDate || e.date);
    return due >= start && due <= end;
  }).sort((a, b) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime());
}

/** AJUSTE 8: Contas da próxima semana para meta semanal */
export function getNextWeekBills(entries: FinancialEntry[]): FinancialEntry[] {
  const nextWeekStart = shiftWeek(new Date(), 1);
  return getWeekBills(entries, nextWeekStart);
}

// ==================== INVESTMENT CALCULATIONS ====================

export function calcTotalInvested(investments: Investment[]): number {
  return investments.reduce((sum, inv) => sum + (inv.type === "deposit" ? inv.value : -inv.value), 0);
}

export function calcInvestmentWithYield(investments: Investment[]): number {
  let total = 0;
  const sorted = [...investments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const inv of sorted) {
    if (inv.type === "deposit") total += inv.value;
    else total -= inv.value;
  }
  return Math.max(0, total);
}

// ==================== EXTRA INCOME CALCULATIONS ====================

export function calcTotalExtraIncome(items: ExtraIncome[], start?: Date, end?: Date): number {
  const filtered = start && end ? items.filter((i) => isInRange(i.date, start, end)) : items;
  return filtered.reduce((sum, i) => sum + i.value, 0);
}

// ==================== CHART DATA HELPERS ====================

export function getWeeklyEarningsData(earnings: MotoEarning[], refDate?: Date): { labels: string[]; data: number[] } {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const ref = refDate || new Date();
  const startOfWeek = getStartOfWeek(ref);
  const endOfWeek = getEndOfWeek(ref);
  const data = new Array(7).fill(0);
  earnings.forEach((e) => {
    const d = new Date(e.date + "T12:00:00");
    if (d >= startOfWeek && d <= endOfWeek) {
      let dayIndex = d.getDay() - 1;
      if (dayIndex < 0) dayIndex = 6;
      data[dayIndex] += e.value;
    }
  });
  return { labels: days, data };
}

export function getEarningsByApp(earnings: MotoEarning[]): { labels: string[]; data: number[] } {
  const byApp: Record<string, number> = {};
  earnings.forEach((e) => { byApp[e.appName] = (byApp[e.appName] || 0) + e.value; });
  return { labels: Object.keys(byApp), data: Object.values(byApp) };
}

/** AJUSTE 2.1: Ganhos diários por aplicativo (agrupados por dia da semana) */
export function getWeeklyEarningsByApp(
  earnings: MotoEarning[], refDate?: Date
): { labels: string[]; datasets: { appName: string; data: number[]; color: string }[] } {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const ref = refDate || new Date();
  const startOfWeek = getStartOfWeek(ref);
  const endOfWeek = getEndOfWeek(ref);
  const filtered = earnings.filter((e) => {
    const d = new Date(e.date + "T12:00:00");
    return d >= startOfWeek && d <= endOfWeek;
  });
  const apps = [...new Set(filtered.map((e) => e.appName))];
  const datasets = apps.map((appName) => {
    const data = new Array(7).fill(0);
    filtered.filter((e) => e.appName === appName).forEach((e) => {
      const d = new Date(e.date + "T12:00:00");
      let idx = d.getDay() - 1;
      if (idx < 0) idx = 6;
      data[idx] += e.value;
    });
    return { appName, data, color: getAppColor(appName) };
  });
  return { labels: days, datasets };
}

export function getMonthlyEarningsByApp(
  earnings: MotoEarning[], refDate: Date
): { labels: string[]; datasets: { appName: string; data: number[] }[] } {
  const start = getStartOfMonth(refDate);
  const end = getEndOfMonth(refDate);
  const daysInMonth = end.getDate();
  const filtered = earnings.filter((e) => isInRange(e.date, start, end));
  const apps = [...new Set(filtered.map((e) => e.appName))];
  const labels: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) labels.push(String(i));
  const datasets = apps.map((appName) => {
    const data = new Array(daysInMonth).fill(0);
    filtered.filter((e) => e.appName === appName).forEach((e) => {
      const day = new Date(e.date + "T12:00:00").getDate() - 1;
      data[day] += e.value;
    });
    return { appName, data };
  });
  return { labels, datasets };
}

export function getMonthlyMaintenanceData(maintenance: Maintenance[]): { labels: string[]; data: number[] } {
  const months: Record<string, number> = {};
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  maintenance.forEach((m) => {
    const d = new Date(m.date + "T12:00:00");
    const key = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;
    months[key] = (months[key] || 0) + m.value;
  });
  return { labels: Object.keys(months), data: Object.values(months) };
}

/** Dados de manutenção ANUAL agrupados por mês */
export function getAnnualMaintenanceData(maintenance: Maintenance[], refDate: Date): { labels: string[]; data: number[] } {
  const year = refDate.getFullYear();
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const data = new Array(12).fill(0);
  maintenance.forEach((m) => {
    const d = new Date(m.date + "T12:00:00");
    if (d.getFullYear() === year) {
      data[d.getMonth()] += m.value;
    }
  });
  return { labels: monthNames, data };
}

export function getMaintenanceByItem(maintenance: Maintenance[], start?: Date, end?: Date): { labels: string[]; data: number[] } {
  const filtered = start && end ? maintenance.filter((m) => isInRange(m.date, start, end)) : maintenance;
  const byItem: Record<string, number> = {};
  filtered.forEach((m) => { byItem[m.item] = (byItem[m.item] || 0) + m.value; });
  return { labels: Object.keys(byItem), data: Object.values(byItem) };
}

/** Dados de renda extra por mês com separação por tipo */
export function getExtraIncomeMonthlyByType(
  extraIncomes: ExtraIncome[], refDate: Date
): { labels: string[]; datasets: { name: string; data: number[] }[] } {
  const year = refDate.getFullYear();
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const filtered = extraIncomes.filter((e) => new Date(e.date + "T12:00:00").getFullYear() === year);
  const types = [...new Set(filtered.map((e) => e.name))];
  const datasets = types.map((name) => {
    const data = new Array(12).fill(0);
    filtered.filter((e) => e.name === name).forEach((e) => {
      const d = new Date(e.date + "T12:00:00");
      data[d.getMonth()] += e.value;
    });
    return { name, data };
  });
  return { labels: monthNames, datasets };
}

export function getMonthlyDailyData(
  earnings: MotoEarning[], extraIncomes: ExtraIncome[], financials: FinancialEntry[], refDate?: Date
): { labels: string[]; motoData: number[]; extraData: number[]; gastoData: number[] } {
  const ref = refDate || new Date();
  const start = getStartOfMonth(ref);
  const end = getEndOfMonth(ref);
  const daysInMonth = end.getDate();
  const labels: string[] = [];
  const motoData = new Array(daysInMonth).fill(0);
  const extraData = new Array(daysInMonth).fill(0);
  const gastoData = new Array(daysInMonth).fill(0);
  for (let i = 1; i <= daysInMonth; i++) labels.push(String(i));
  earnings.filter((e) => isInRange(e.date, start, end)).forEach((e) => {
    const day = new Date(e.date + "T12:00:00").getDate() - 1;
    motoData[day] += e.value;
  });
  extraIncomes.filter((e) => isInRange(e.date, start, end)).forEach((e) => {
    const day = new Date(e.date + "T12:00:00").getDate() - 1;
    extraData[day] += e.value;
  });
  financials.filter((e) => e.type === "expense" && isInRange(e.date, start, end)).forEach((e) => {
    const day = new Date(e.date + "T12:00:00").getDate() - 1;
    gastoData[day] += e.value;
  });
  for (let i = 1; i < daysInMonth; i++) {
    motoData[i] += motoData[i - 1];
    extraData[i] += extraData[i - 1];
    gastoData[i] += gastoData[i - 1];
  }
  return { labels, motoData, extraData, gastoData };
}

// ==================== APP COLORS ====================

export const APP_COLORS: Record<string, string> = {
  "iFood": "#EA1D2C",
  "99Food": "#FFCC00",
  "Rappi": "#FF6B00",
  "Lalamove": "#F57C00",
  "Loggi": "#00B0FF",
  "Uber Eats": "#06C167",
  "InDriver": "#2ECC40",
  "Shein": "#000000",
};

// AJUSTE 4.1: getAppColor agora aceita cores personalizadas do config
export function getAppColor(appName: string, customColors?: Record<string, string>): string {
  if (customColors && customColors[appName]) return customColors[appName];
  return APP_COLORS[appName] || "#4CAF50";
}

// ==================== SIMULADOR DE PREVISÃO ====================

export interface ForecastResult {
  dailyEarning: number;
  weeklyEarning: number;
  monthlyEarning: number;
  annualEarning: number;
}

export function calcForecast(kmPerDay: number, daysPerWeek: number, valuePerKm: number): ForecastResult {
  const dailyEarning = kmPerDay * valuePerKm;
  const weeklyEarning = dailyEarning * daysPerWeek;
  const monthlyEarning = weeklyEarning * 4.33;
  const annualEarning = monthlyEarning * 12;
  return { dailyEarning, weeklyEarning, monthlyEarning, annualEarning };
}

export function calcKmNeeded(targetDaily: number, valuePerKm: number): number {
  if (valuePerKm <= 0) return 0;
  return targetDaily / valuePerKm;
}

// ==================== CUSTO REAL COM FILTROS ====================

export type CostPeriod = "daily" | "weekly" | "monthly" | "custom";

/** AJUSTE 1: netProfit agora NÃO subtrai manutenção (já contemplada no custo/KM) */
export function getCostRealData(
  earnings: MotoEarning[], dailyKms: DailyKm[], maintenance: Maintenance[],
  costPerKm: number, period: CostPeriod, refDate?: Date, customStart?: Date, customEnd?: Date
): {
  totalEarnings: number; totalKm: number; kmCost: number;
  maintenanceCost: number; netProfit: number; avgPerKm: number;
  start: Date; end: Date;
} {
  const ref = refDate || new Date();
  let start: Date;
  let end: Date;
  switch (period) {
    case "daily":
      start = new Date(ref); start.setHours(0, 0, 0, 0);
      end = new Date(ref); end.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      start = getStartOfWeek(ref); end = getEndOfWeek(ref);
      break;
    case "monthly":
      start = getStartOfMonth(ref); end = getEndOfMonth(ref);
      break;
    case "custom":
      start = customStart || getStartOfMonth(ref); end = customEnd || getEndOfMonth(ref);
      break;
    default:
      start = getStartOfMonth(ref); end = getEndOfMonth(ref);
  }
  const totalEarnings = calcTotalEarnings(earnings, start, end);
  const totalKm = calcTotalKm(dailyKms, start, end);
  const kmCost = calcCostPerKm(totalKm, costPerKm);
  const maintenanceCost = calcMaintenanceCost(maintenance, start, end);
  // AJUSTE 1: Lucro líquido = ganhos - custo KM (sem subtrair manutenção)
  const netProfit = totalEarnings - kmCost;
  const avgPerKm = totalKm > 0 ? totalEarnings / totalKm : 0;
  return { totalEarnings, totalKm, kmCost, maintenanceCost, netProfit, avgPerKm, start, end };
}

// ==================== LIMITADOR DE GASTOS ====================

export function getCategorySpending(
  financials: FinancialEntry[], category: string, period: "week" | "month", refDate?: Date
): number {
  const ref = refDate || new Date();
  const start = period === "week" ? getStartOfWeek(ref) : getStartOfMonth(ref);
  const end = period === "week" ? getEndOfWeek(ref) : getEndOfMonth(ref);
  return financials
    .filter((e) => e.type === "expense" && e.category === category && isInRange(e.date, start, end))
    .reduce((s, e) => s + e.value, 0);
}

// ==================== PREVISÃO COMPLETA ====================

export interface ForecastFullResult {
  kmPerDay: number;
  kmPerWeek: number;
  kmPerMonth: number;
  kmPerYear: number;
  earningWeekly: number;
  earningMonthly: number;
  earningAnnual: number;
  items: {
    name: string;
    unitCost: number;
    kmDuration: number;
    changesPerYear: number;
    annualCost: number;
  }[];
  totalAnnualCost: number;
  totalMonthlyCost: number;
  realCostPerKm: number;
}

export function calcFullForecast(
  dailyGoal: number,
  valuePerKm: number,
  daysPerWeek: number,
  items: { name: string; unitCost: number; kmDuration: number }[]
): ForecastFullResult {
  const kmPerDay = valuePerKm > 0 ? dailyGoal / valuePerKm : 0;
  const kmPerWeek = kmPerDay * daysPerWeek;
  const kmPerMonth = kmPerWeek * 4.33;
  const kmPerYear = kmPerMonth * 12;

  const earningWeekly = dailyGoal * daysPerWeek;
  const earningMonthly = earningWeekly * 4.33;
  const earningAnnual = earningMonthly * 12;

  const forecastItems = items.map((item) => {
    const changesPerYear = item.kmDuration > 0 ? kmPerYear / item.kmDuration : 0;
    const annualCost = changesPerYear * item.unitCost;
    return { ...item, changesPerYear, annualCost };
  });

  const totalAnnualCost = forecastItems.reduce((s, i) => s + i.annualCost, 0);
  const totalMonthlyCost = totalAnnualCost / 12;
  const realCostPerKm = kmPerYear > 0 ? totalAnnualCost / kmPerYear : 0;

  return {
    kmPerDay, kmPerWeek, kmPerMonth, kmPerYear,
    earningWeekly, earningMonthly, earningAnnual,
    items: forecastItems, totalAnnualCost, totalMonthlyCost, realCostPerKm,
  };
}

// ==================== HELPERS PARA FECHAMENTO AUTOMÁTICO ====================

/** Verifica se a semana de referência já terminou (domingo 23:59 já passou) */
export function isWeekClosed(refDate: Date): boolean {
  const endOfWeek = getEndOfWeek(refDate);
  return new Date() > endOfWeek;
}

/** AJUSTE 5.2: Retorna a data de pagamento baseada na configuração do app (com dias da semana) */
export function getPaymentDate(
  weekEndDate: Date,
  paymentMode: "next_day" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "weekly" | "manual" | "instant"
): Date | null {
  switch (paymentMode) {
    case "instant":
    case "next_day":
      const next = new Date(weekEndDate);
      next.setDate(next.getDate() + 1);
      return next;
    case "monday": return getNextDayOfWeek(weekEndDate, 1);
    case "tuesday": return getNextDayOfWeek(weekEndDate, 2);
    case "wednesday": return getNextDayOfWeek(weekEndDate, 3);
    case "thursday": return getNextDayOfWeek(weekEndDate, 4);
    case "friday": return getNextDayOfWeek(weekEndDate, 5);
    case "weekly": {
      const w = new Date(weekEndDate);
      w.setDate(w.getDate() + 7);
      return w;
    }
    case "manual":
    default:
      return null;
  }
}

/** Retorna a próxima ocorrência de um dia da semana após uma data */
function getNextDayOfWeek(afterDate: Date, targetDay: number): Date {
  const d = new Date(afterDate);
  const currentDay = d.getDay();
  const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  return d;
}

/** Retorna contas do mês para Contas Mensais */
export function getMonthBills(entries: FinancialEntry[], refDate?: Date): FinancialEntry[] {
  const d = refDate || new Date();
  const start = getStartOfMonth(d);
  const end = getEndOfMonth(d);
  return entries.filter((e) => {
    if (e.type !== "expense") return false;
    const due = new Date(e.dueDate || e.date);
    return due >= start && due <= end;
  }).sort((a, b) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime());
}
