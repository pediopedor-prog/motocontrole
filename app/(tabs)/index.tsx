import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, Platform, Share, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card, StatCard } from "@/components/ui/card";
import { SimpleBarChart, SimpleLineChart, DateNavigator } from "@/components/ui/simple-chart";
import { useData } from "@/lib/data-context";
import { useColors } from "@/hooks/use-colors";
import {
  calcTotalEarnings, calcTotalEarningsReceived, calcTotalEarningsPending,
  calcTotalKm, calcTotalExtraIncome,
  getCategorySpending,
  getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth,
  getMonthlyDailyData, getWeekBills,
  formatCurrency, formatDate, formatWeekRange, formatMonthRange,
  shiftMonth, shiftWeek, isInRange, todayFormatted,
} from "@/lib/calculations";
import { IconSymbol } from "@/components/ui/icon-symbol";

const APP_VERSION = "1.9.0";

export default function DashboardScreen() {
  const {
    earnings, dailyKms, maintenance, financials, extraIncomes, forecasts,
    weeklyKmCosts, config, loading,
    exportData, importData, clearAllData,
  } = useData();
  const colors = useColors();
  const [monthRef, setMonthRef] = useState(new Date());
  const [weekRef, setWeekRef] = useState(new Date());
  const [showBackup, setShowBackup] = useState(false);
  const [importJson, setImportJson] = useState("");

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-muted text-lg">Carregando...</Text>
      </ScreenContainer>
    );
  }

  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);
  const monthStart = getStartOfMonth(now);
  const monthEnd = getEndOfMonth(now);

  const weeklyEarnings = calcTotalEarnings(earnings, weekStart, weekEnd);
  const monthlyEarnings = calcTotalEarnings(earnings, monthStart, monthEnd);
  const totalKm = calcTotalKm(dailyKms, monthStart, monthEnd);

  const monthlyEarningsReceived = calcTotalEarningsReceived(earnings, monthStart, monthEnd);
  const monthlyPending = calcTotalEarningsPending(earnings, monthStart, monthEnd);

  // Combustível e Custo KM são excluídos do saldo — já foram descontados no fechamento semanal de KM
  const paidExpenses = financials
    .filter((e) => e.type === "expense" && e.isPaid && isInRange(e.date, monthStart, monthEnd)
      && e.category !== "Combustível"
      && !e.description.startsWith("Custo KM"))
    .reduce((s, e) => s + e.value, 0);
  const financialIncome = financials
    .filter((e) => e.type === "income" && e.isPaid && isInRange(e.date, monthStart, monthEnd))
    .reduce((s, e) => s + e.value, 0);
  const totalMonthlyExpenses = paidExpenses;

  const extraTotal = calcTotalExtraIncome(extraIncomes, monthStart, monthEnd);
  const initialBalance = config.initialBalance || 0;
  const totalBalance = initialBalance + monthlyEarningsReceived + extraTotal + financialIncome - totalMonthlyExpenses;

  const monthBillsUnpaid = financials.filter((e) => {
    if (e.type !== "expense" || e.isPaid) return false;
    const due = new Date(e.dueDate || e.date);
    return due >= monthStart && due <= monthEnd;
  });
  const totalMonthBillsUnpaid = monthBillsUnpaid.reduce((s, e) => s + e.value, 0);

  const workDays = config.workDaysPerWeek || 5;
  const weeklyGoalMode = config.weeklyGoalMode || "next";

  // Semana de referência para meta (atual ou próxima)
  const goalWeekStart = weeklyGoalMode === "current" ? weekStart : new Date(weekEnd.getTime() + 86400000);
  const goalWeekBillsAll = getWeekBills(financials, goalWeekStart);
  const totalGoalWeekBills = goalWeekBillsAll.reduce((s, e) => s + e.value, 0);
  const goalWeekBillsPaid = goalWeekBillsAll.filter((e) => e.isPaid).reduce((s, e) => s + e.value, 0);

  const currentWeekKms = dailyKms.filter((e) => isInRange(e.date, weekStart, weekEnd));
  const currentWeekTotalKm = currentWeekKms.reduce((s, e) => s + e.km, 0);
  const currentWeekKmCost = currentWeekTotalKm * config.costPerKm;

  const reservePct = config.investmentPercentage || 0;
  const reserveInGoal = config.reserveInWeeklyGoal || false;
  const reserveAmount = reserveInGoal ? (weeklyEarnings * reservePct / 100) : 0;
  const weeklyGoalTotal = totalGoalWeekBills + currentWeekKmCost + reserveAmount;
  const dailyGoal = workDays > 0 ? weeklyGoalTotal / workDays : 0;

  const weeklyProgress = weeklyEarnings + goalWeekBillsPaid;
  const weeklyRemaining = Math.max(0, weeklyGoalTotal - weeklyProgress);
  const daysRemaining = Math.max(1, workDays - Math.min(workDays, now.getDay() === 0 ? workDays : now.getDay()));
  const dailyRemainingGoal = daysRemaining > 0 ? weeklyRemaining / daysRemaining : 0;
  const avgDiaGoalWeek = workDays > 0 ? weeklyGoalTotal / workDays : 0;

  // Total de dias trabalhados no mês atual
  const { workShifts } = useData() as any;
  const daysWorkedThisMonth = workShifts
    ? new Set(
        (workShifts as any[])
          .filter((s: any) => isInRange(s.date, monthStart, monthEnd))
          .map((s: any) => s.date)
      ).size
    : new Set(earnings.filter((e) => isInRange(e.date, monthStart, monthEnd)).map((e) => e.date)).size;

  const currentMotoKm = config.currentMotoKm || 0;
  const kmAlerts = forecasts.filter((f) => {
    if (!f.kmDuration || f.kmDuration <= 0) return false;
    // Busca última manutenção deste item
    const lastMaint = [...maintenance]
      .filter((m) => m.item === f.item)
      .sort((a, b) => b.km - a.km)[0];
    const lastKm = lastMaint ? lastMaint.km : 0;
    const nextKm = lastKm + f.kmDuration;
    const kmToNext = nextKm - currentMotoKm;
    return kmToNext <= f.kmDuration * 0.15 || kmToNext <= 0; // alerta nos últimos 15% ou vencido
  });

  // Contas da semana navegável
  const weekBillsRef = getWeekBills(financials, weekRef);
  const weekBillsUnpaid = weekBillsRef.filter((e) => !e.isPaid);
  const weekBillsPaid = weekBillsRef.filter((e) => e.isPaid);
  const weekBillsTotal = weekBillsRef.reduce((s, e) => s + e.value, 0);

  // Gráfico mensal
  const monthlyData = getMonthlyDailyData(earnings, extraIncomes, financials, monthRef);

  // Alertas de limite de gastos
  const limits = config.spendingLimits || [];
  const overLimits = limits.filter((lim) => {
    const spent = getCategorySpending(financials, lim.category, lim.period);
    return spent >= lim.limit * 0.8;
  });

  // Backup
  const handleExport = async () => {
    try {
      const data = await exportData();
      if (Platform.OS === "web") {
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `MotoControle_backup_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert("Backup exportado com sucesso!");
      } else {
        await Share.share({ message: data, title: "MotoControle Backup" });
      }
    } catch (err) {
      if (Platform.OS === "web") alert("Erro ao exportar"); else Alert.alert("Erro", "Falha ao exportar backup");
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      if (Platform.OS === "web") alert("Cole o JSON do backup"); else Alert.alert("Atenção", "Cole o JSON do backup");
      return;
    }
    const success = await importData(importJson);
    if (success) {
      if (Platform.OS === "web") alert("Backup restaurado!"); else Alert.alert("Sucesso", "Backup restaurado!");
      setImportJson("");
    } else {
      if (Platform.OS === "web") alert("Erro: JSON inválido"); else Alert.alert("Erro", "JSON inválido");
    }
  };

  const handleClear = () => {
    const doIt = () => { clearAllData(); };
    if (Platform.OS === "web") {
      if (confirm("Tem certeza? Todos os dados serão apagados!")) doIt();
    } else {
      Alert.alert("Atenção", "Todos os dados serão apagados!", [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar Tudo", style: "destructive", onPress: doIt },
      ]);
    }
  };

  const goalLabel = weeklyGoalMode === "current" ? "Meta Semanal (Esta Semana)" : "Meta Semanal (Próxima Semana)";
  const avgLabel = weeklyGoalMode === "current" ? "Média Dia (Esta Semana)" : "Média Dia (Próxima Semana)";

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Header */}
        <View className="px-5 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">MotoControle</Text>
              <Text className="text-sm text-muted mt-1">Hoje: {todayFormatted()}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted">v{APP_VERSION}</Text>
              <TouchableOpacity onPress={() => setShowBackup(!showBackup)}>
                <IconSymbol name="gearshape.fill" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Backup - Removido Exportar e Limpar conforme solicitado */}
        {showBackup && (
          <View className="mx-5 mb-4 bg-surface border border-border rounded-2xl p-4">
            <Text className="text-sm font-bold text-foreground mb-3">Restauração de Backup</Text>
            <Text className="text-xs text-muted mb-1">Para restaurar, cole o JSON do backup abaixo:</Text>
            <TextInput
              className="bg-background border border-border rounded-xl p-2 text-foreground text-xs"
              style={{ minHeight: 60 }}
              multiline
              placeholder="Cole aqui o JSON do backup..."
              placeholderTextColor={colors.muted}
              value={importJson}
              onChangeText={setImportJson}
            />
            {importJson.trim().length > 0 && (
              <TouchableOpacity onPress={handleImport}
                style={{ backgroundColor: colors.success, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 10 }}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Restaurar Agora</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Alertas de limite de gastos */}
        {overLimits.length > 0 && (
          <View className="mx-5 mb-4 bg-yellow-500/10 border-2 border-yellow-500 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />
              <Text className="text-sm font-bold ml-2" style={{ color: colors.warning }}>Alertas de Limite</Text>
            </View>
            {overLimits.map((lim, i) => {
              const spent = getCategorySpending(financials, lim.category, lim.period);
              const pct = lim.limit > 0 ? (spent / lim.limit) * 100 : 0;
              return (
                <Text key={i} className="text-xs text-foreground ml-6 mb-1">
                  • {lim.category}: {pct.toFixed(0)}% ({formatCurrency(spent)} / {formatCurrency(lim.limit)})
                  {pct >= 100 ? " - ULTRAPASSADO!" : " - Atenção!"}
                </Text>
              );
            })}
          </View>
        )}

        {/* Odômetro + Dias Trabalhados - REMOVIDO conforme solicitado */}

        {/* Alertas de manutenção por KM */}
        {kmAlerts.length > 0 && (
          <View className="mx-5 mb-4 bg-red-500/10 border-2 border-red-500 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <IconSymbol name="wrench.fill" size={18} color={colors.error} />
              <Text className="text-sm font-bold ml-2" style={{ color: colors.error }}>Manutenção Necessária</Text>
            </View>
            {kmAlerts.map((f, i) => {
              const lastMaint = [...maintenance]
                .filter((m) => m.item === f.item)
                .sort((a, b) => b.km - a.km)[0];
              const lastKm = lastMaint ? lastMaint.km : 0;
              const nextKm = lastKm + f.kmDuration;
              const kmToNext = nextKm - currentMotoKm;
              return (
                <Text key={i} className="text-xs text-foreground ml-6 mb-1">
                  • {f.item}: {kmToNext <= 0
                    ? `Vencido! (${Math.abs(kmToNext).toFixed(0)} km atrasado)`
                    : `Faltam ${kmToNext.toFixed(0)} km`}
                  {" "}(próx. troca: {nextKm.toFixed(0)} km)
                </Text>
              );
            })}
          </View>
        )}

        {/* Meta Semanal */}
        <View className="mx-5 mb-4 bg-surface border-2 rounded-2xl p-4"
          style={{ borderColor: weeklyRemaining > 0 ? colors.warning : colors.success }}>
          <View className="flex-row items-center mb-2">
            <IconSymbol name="target" size={20} color={weeklyRemaining > 0 ? colors.warning : colors.success} />
            <Text className="text-base font-bold text-foreground ml-2">{goalLabel}</Text>
          </View>

          {weeklyGoalTotal > 0 ? (
            <>
              <Text className="text-xs text-muted mb-1">
                Contas da semana: {formatCurrency(totalGoalWeekBills)}
              </Text>
              {reserveAmount > 0 && (
                <Text className="text-xs text-muted mb-1">
                  Reserva ({reservePct}%): {formatCurrency(reserveAmount)}
                </Text>
              )}
              {currentWeekKmCost > 0 && (
                <Text className="text-xs text-muted mb-1">
                  Custo KM ({currentWeekTotalKm.toFixed(0)} km × {formatCurrency(config.costPerKm)}/km): {formatCurrency(currentWeekKmCost)}
                </Text>
              )}
              <Text className="text-xs text-muted mb-2">
                Total: {formatCurrency(weeklyGoalTotal)} em {workDays} dias
              </Text>

              <View className="bg-background rounded-full h-4 mb-2 overflow-hidden">
                <View style={{
                  width: `${Math.min(100, (weeklyProgress / weeklyGoalTotal) * 100)}%`,
                  height: "100%",
                  backgroundColor: weeklyProgress >= weeklyGoalTotal ? colors.success : colors.primary,
                  borderRadius: 999,
                }} />
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs font-bold text-foreground">
                  {formatCurrency(weeklyProgress)} / {formatCurrency(weeklyGoalTotal)}
                </Text>
                <Text className="text-xs text-muted">{((weeklyProgress / weeklyGoalTotal) * 100).toFixed(0)}%</Text>
              </View>

              {weeklyRemaining > 0 ? (
                <View className="bg-warning/10 rounded-xl p-3 mt-1">
                  <Text className="text-sm font-bold" style={{ color: colors.warning }}>
                    Falta {formatCurrency(weeklyRemaining)}
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    ~{formatCurrency(dailyRemainingGoal)}/dia nos próximos {daysRemaining} dia(s)
                  </Text>
                </View>
              ) : (
                <View className="bg-green-500/10 rounded-xl p-3 mt-1">
                  <Text className="text-sm font-bold" style={{ color: colors.success }}>Meta atingida! Parabéns!</Text>
                </View>
              )}
            </>
          ) : (
            <Text className="text-xs text-muted">Nenhuma conta pendente para a semana. Cadastre contas no Financeiro.</Text>
          )}
        </View>

        {/* Média Dia */}
        {weeklyGoalTotal > 0 && (
          <View className="mx-5 mb-4 bg-surface border border-warning/30 rounded-2xl p-4">
            <View className="flex-row items-center mb-1">
              <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />
              <Text className="text-sm font-semibold text-foreground ml-2">{avgLabel}</Text>
            </View>
            <Text className="text-xs text-muted">
              Se trabalhar {workDays} dias, precisa fazer {formatCurrency(avgDiaGoalWeek)} por dia.
            </Text>
            <Text className="text-lg font-bold text-foreground mt-1">{formatCurrency(avgDiaGoalWeek)}/dia</Text>
          </View>
        )}

        {/* Stats Grid */}
        <View className="px-5 gap-3">
          <View className="flex-row gap-3">
            <StatCard title="Saldo" value={formatCurrency(totalBalance)}
              icon={<IconSymbol name="dollarsign.circle.fill" size={18} color={totalBalance >= 0 ? colors.success : colors.error} />} />
            <StatCard title="Ganhos Mês" value={formatCurrency(monthlyEarnings)}
              icon={<IconSymbol name="chart.line.uptrend.xyaxis" size={18} color={colors.success} />} />
          </View>
          <View className="flex-row gap-3">
            <StatCard title="Contas a Vencer" value={formatCurrency(totalMonthBillsUnpaid)}
              icon={<IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />} />
            <StatCard title="Ganhos Semana" value={formatCurrency(weeklyEarnings)}
              icon={<IconSymbol name="calendar" size={18} color={colors.primary} />} />
          </View>
          <View className="flex-row gap-3">
            <StatCard title="Renda Extra" value={formatCurrency(extraTotal)}
              icon={<IconSymbol name="plus.circle.fill" size={18} color={colors.success} />} />
            <StatCard title="Gasto do Mês" value={formatCurrency(totalMonthlyExpenses)}
              icon={<IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.error} />} />
          </View>
          <View className="flex-row gap-3">
            <StatCard title="KM Rodado" value={`${totalKm.toFixed(0)} km`}
              icon={<IconSymbol name="speedometer" size={18} color={colors.muted} />} />
            {monthlyPending > 0 ? (
              <StatCard title="Pendente Apps" value={formatCurrency(monthlyPending)}
                icon={<IconSymbol name="clock.fill" size={18} color={colors.warning} />} />
            ) : (
              <View className="flex-1" />
            )}
          </View>
        </View>

        {/* Contas da Semana */}
        <View className="mx-5 mt-4 mb-4 bg-surface border border-border rounded-2xl p-4">
          <Text className="text-sm font-semibold text-muted mb-2 uppercase tracking-wide">Contas da Semana</Text>
          <DateNavigator
            label={formatWeekRange(weekRef)}
            onPrev={() => setWeekRef(shiftWeek(weekRef, -1))}
            onNext={() => setWeekRef(shiftWeek(weekRef, 1))}
          />
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted">Total da Semana:</Text>
            <Text className="text-sm font-bold" style={{ color: colors.error }}>{formatCurrency(weekBillsTotal)}</Text>
          </View>
          {weekBillsUnpaid.length > 0 && (
            <>
              <Text className="text-sm font-bold mb-2" style={{ color: colors.warning }}>A Pagar:</Text>
              {weekBillsUnpaid.map((e) => (
                <View key={e.id} className="bg-background border border-border rounded-xl p-3 mb-2">
                  <Text className="text-base font-bold text-foreground">{e.description || e.category}</Text>
                  <Text className="text-sm font-bold text-muted mt-1">{formatDate(e.dueDate || e.date)}</Text>
                  <Text className="text-base font-bold mt-1" style={{ color: colors.error }}>{formatCurrency(e.value)}</Text>
                </View>
              ))}
            </>
          )}
          {weekBillsPaid.length > 0 && (
            <>
              <Text className="text-sm font-bold mt-2 mb-2" style={{ color: colors.success }}>Pagas:</Text>
              {weekBillsPaid.map((e) => (
                <View key={e.id} className="bg-background border border-border rounded-xl p-3 mb-2" style={{ opacity: 0.7 }}>
                  <Text className="text-base font-bold text-muted line-through">{e.description || e.category}</Text>
                  <Text className="text-sm font-bold text-muted mt-1">{formatDate(e.dueDate || e.date)}</Text>
                  <Text className="text-base font-bold text-muted mt-1">{formatCurrency(e.value)}</Text>
                </View>
              ))}
            </>
          )}
          {weekBillsRef.length === 0 && (
            <Text className="text-xs text-muted text-center py-2">Nenhuma conta nesta semana</Text>
          )}
        </View>

        {/* Gráfico Ganhos vs Gastos — sem Total */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-sm font-semibold text-muted mb-1 uppercase tracking-wide">Ganhos vs Gastos (Mês)</Text>
          <View className="flex-row justify-between mb-3">
            <Text className="text-xs" style={{ color: colors.success }}>Entradas: {formatCurrency(monthlyEarnings + extraTotal)}</Text>
            <Text className="text-xs" style={{ color: colors.error }}>Saídas: {formatCurrency(totalMonthlyExpenses)}</Text>
          </View>
          <SimpleBarChart
            labels={["Ganhos", "Gastos"]}
            data={[monthlyEarnings + extraTotal, totalMonthlyExpenses]}
            barColors={["#4ADE80", "#F87171"]}
            height={120} showValues
          />
        </View>

        {/* Gráfico Ganhos do Mês — sem Total, com valores nas pontas */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-sm font-semibold text-muted mb-3 uppercase tracking-wide">Ganhos do Mês</Text>
          <DateNavigator
            label={formatMonthRange(monthRef)}
            onPrev={() => setMonthRef(shiftMonth(monthRef, -1))}
            onNext={() => setMonthRef(shiftMonth(monthRef, 1))}
          />
          <SimpleLineChart
            labels={monthlyData.labels}
            datasets={[
              { data: monthlyData.motoData, color: "#4ADE80", label: "Moto" },
              { data: monthlyData.extraData, color: "#FBBF24", label: "Renda Extra" },
              { data: monthlyData.gastoData, color: "#F87171", label: "Gastos" },
            ]}
            height={160} width={340} showValues
          />
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}
