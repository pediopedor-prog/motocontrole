import { useState, useMemo } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, Platform, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card, StatCard } from "@/components/ui/card";
import { SimpleBarChart, SimpleLineChart, DateNavigator } from "@/components/ui/simple-chart";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useData } from "@/lib/data-context";
import { useColors } from "@/hooks/use-colors";
import {
  calcTotalInvested, calcTotalEarnings,
  getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth,
  formatCurrency, formatDate, todayFormatted, todayStr, parseDateInput,
  shiftYear, formatYearRange,
} from "@/lib/calculations";

type SubTab = "carteiras" | "reserva" | "investimentos";

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "carteiras", label: "Carteiras" },
  { key: "reserva", label: "Reserva" },
  { key: "investimentos", label: "Investimentos" },
];

export default function InvestimentoScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>("carteiras");
  const colors = useColors();

  return (
    <ScreenContainer>
      {/* ===== MENU PADRONIZADO - Estilo pill/chip horizontal (mesmo da aba Geral) ===== */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {SUB_TABS.map((tab) => (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
              style={{
                paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, marginRight: 8,
                backgroundColor: activeTab === tab.key ? colors.primary : "transparent",
                borderWidth: 1, borderColor: activeTab === tab.key ? colors.primary : colors.border,
                alignSelf: 'flex-start',
              }}>
              <Text style={{
                color: activeTab === tab.key ? "#fff" : colors.muted,
                fontWeight: activeTab === tab.key ? "700" : "500", fontSize: 13,
              }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === "carteiras" && <CarteirasTab />}
      {activeTab === "reserva" && <ReservaTab />}
      {activeTab === "investimentos" && <InvestimentosTab />}
    </ScreenContainer>
  );
}

// ==================== CARTEIRAS ====================
function CarteirasTab() {
  const { config, saveConfig, walletTransactions, addWalletTransaction, removeWalletTransaction } = useData();
  const colors = useColors();
  const [newWalletName, setNewWalletName] = useState("");
  const [depositWallet, setDepositWallet] = useState<string | null>(null);
  const [depositValue, setDepositValue] = useState("");
  const [depositDesc, setDepositDesc] = useState("");
  const [yearRef, setYearRef] = useState(new Date());

  const wallets = config.wallets || [];

  const getWalletBalance = (walletId: string) => {
    return walletTransactions
      .filter((t) => t.walletId === walletId)
      .reduce((sum, t) => {
        if (t.type === "deposit" || t.type === "yield") return sum + t.value;
        return sum - t.value;
      }, 0);
  };

  const handleAddWallet = async () => {
    if (!newWalletName.trim()) return;
    const newWallet = {
      id: `wallet_${Date.now()}`,
      name: newWalletName.trim(),
      balance: 0,
      yieldRate: 0,
      createdAt: new Date().toISOString(),
    };
    await saveConfig({ wallets: [...wallets, newWallet] });
    setNewWalletName("");
  };

  const handleDeposit = async (walletId: string, type: "deposit" | "withdrawal") => {
    if (!depositValue) return;
    await addWalletTransaction({
      walletId,
      type,
      value: parseFloat(depositValue.replace(",", ".")),
      description: depositDesc || (type === "deposit" ? "Depósito" : "Resgate"),
      date: todayStr(),
    });
    setDepositWallet(null);
    setDepositValue("");
    setDepositDesc("");
  };

  const handleDeleteTransaction = async (txId: string, txDesc: string) => {
    const doDelete = async () => { await removeWalletTransaction(txId); };
    if (Platform.OS === "web") {
      if (confirm(`Excluir transação "${txDesc}"?`)) await doDelete();
    } else {
      Alert.alert("Confirmar", `Excluir transação "${txDesc}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const totalBalance = wallets.reduce((s, w) => s + getWalletBalance(w.id), 0);

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const LINE_COLORS = ["#4ADE80", "#60A5FA", "#FBBF24", "#F87171", "#A78BFA", "#34D399", "#FB923C"];

  const walletMonthlyData = useMemo(() => {
    const year = yearRef.getFullYear();
    const datasets = wallets.map((wallet, wi) => {
      const walletTx = walletTransactions
        .filter((t) => t.walletId === wallet.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const monthlyBalances = new Array(12).fill(0);
      let runningBalance = 0;

      walletTx.forEach((t) => {
        const d = new Date(t.date + "T12:00:00");
        if (d.getFullYear() < year) {
          if (t.type === "deposit" || t.type === "yield") runningBalance += t.value;
          else runningBalance -= t.value;
        }
      });

      for (let m = 0; m < 12; m++) {
        walletTx.forEach((t) => {
          const d = new Date(t.date + "T12:00:00");
          if (d.getFullYear() === year && d.getMonth() === m) {
            if (t.type === "deposit" || t.type === "yield") runningBalance += t.value;
            else runningBalance -= t.value;
          }
        });
        monthlyBalances[m] = Math.max(0, runningBalance);
      }

      return { data: monthlyBalances, color: LINE_COLORS[wi % LINE_COLORS.length], label: wallet.name };
    });

    return { labels: monthNames, datasets };
  }, [wallets, walletTransactions, yearRef]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-5 pt-2">
        <Text className="text-lg font-bold text-foreground mb-4">Carteiras</Text>

        <StatCard title="Saldo Total" value={formatCurrency(totalBalance)}
          icon={<IconSymbol name="creditcard.fill" size={18} color={colors.primary} />} />

        {walletMonthlyData.datasets.some((ds) => ds.data.some((v) => v > 0)) && (
          <Card title="Evolução das Carteiras" className="mt-4 mb-2">
            <DateNavigator
              label={formatYearRange(yearRef)}
              onPrev={() => setYearRef(shiftYear(yearRef, -1))}
              onNext={() => setYearRef(shiftYear(yearRef, 1))}
            />
            <SimpleLineChart
              labels={walletMonthlyData.labels}
              datasets={walletMonthlyData.datasets}
              height={180} width={340} showValues
            />
          </Card>
        )}

        {wallets.map((wallet) => {
          const balance = getWalletBalance(wallet.id);
          const recentTx = walletTransactions
            .filter((t) => t.walletId === wallet.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

          return (
            <Card key={wallet.id} title={wallet.name} className="mt-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-muted">Saldo</Text>
                <Text className="text-lg font-bold" style={{ color: balance >= 0 ? colors.success : colors.error }}>
                  {formatCurrency(balance)}
                </Text>
              </View>
              {wallet.yieldRate > 0 && (
                <Text className="text-xs text-muted mb-2">Rendimento: {wallet.yieldRate}% ao mês</Text>
              )}

              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity onPress={() => { setDepositWallet(wallet.id); setDepositDesc("Depósito"); }}
                  style={{ flex: 1, backgroundColor: colors.success, borderRadius: 10, paddingVertical: 8, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>Depositar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setDepositWallet(`${wallet.id}_withdraw`); setDepositDesc("Resgate"); }}
                  style={{ flex: 1, backgroundColor: colors.error, borderRadius: 10, paddingVertical: 8, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>Resgatar</Text>
                </TouchableOpacity>
              </View>

              {(depositWallet === wallet.id || depositWallet === `${wallet.id}_withdraw`) && (
                <View className="bg-background border border-border rounded-xl p-3 mb-3">
                  <Text className="text-xs text-muted mb-1">Valor (R$)</Text>
                  <TextInput className="bg-surface border border-border rounded-xl px-3 py-2 text-foreground mb-2"
                    keyboardType="decimal-pad" value={depositValue} onChangeText={setDepositValue} returnKeyType="done" />
                  <Text className="text-xs text-muted mb-1">Descrição</Text>
                  <TextInput className="bg-surface border border-border rounded-xl px-3 py-2 text-foreground mb-2"
                    value={depositDesc} onChangeText={setDepositDesc} returnKeyType="done" />
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleDeposit(wallet.id, depositWallet === wallet.id ? "deposit" : "withdrawal")}
                      style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 8, alignItems: "center" }}>
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>Confirmar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDepositWallet(null)}
                      style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 8, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 11 }}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {recentTx.length > 0 && (
                <>
                  <Text className="text-xs font-semibold text-muted mb-1 uppercase">Extrato</Text>
                  {recentTx.map((tx) => (
                    <View key={tx.id} className="flex-row items-center py-1.5 border-b border-border/50">
                      <Text className="text-xs text-foreground flex-1">{tx.description}</Text>
                      <Text className="text-xs text-muted mx-2">{formatDate(tx.date)}</Text>
                      <Text className="text-xs font-bold mr-2"
                        style={{ color: tx.type === "withdrawal" ? colors.error : colors.success }}>
                        {tx.type === "withdrawal" ? "-" : "+"}{formatCurrency(tx.value)}
                      </Text>
                      <TouchableOpacity onPress={() => handleDeleteTransaction(tx.id, tx.description)} style={{ padding: 4 }}>
                        <IconSymbol name="trash.fill" size={13} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </Card>
          );
        })}

        <Text className="text-base font-bold text-foreground mt-6 mb-3">Nova Carteira</Text>
        <View className="flex-row gap-2">
          <TextInput className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="Nome da carteira" placeholderTextColor={colors.muted}
            value={newWalletName} onChangeText={setNewWalletName} returnKeyType="done" />
          <TouchableOpacity onPress={handleAddWallet}
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// ==================== RESERVA DE EMERGÊNCIA ====================
function ReservaTab() {
  const { earnings, extraIncomes, config, saveConfig } = useData();
  const colors = useColors();
  const [pctInput, setPctInput] = useState((config.investmentPercentage || 10).toString());
  const [calcMode, setCalcMode] = useState<"weekly" | "monthly">(config.investmentCalcMode || "weekly");
  const [investMode, setInvestMode] = useState<"auto" | "manual">(config.investmentMode || "auto");
  const [reserveInGoal, setReserveInGoal] = useState(config.reserveInWeeklyGoal || false);

  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);
  const monthStart = getStartOfMonth(now);
  const monthEnd = getEndOfMonth(now);

  const weeklyEarnings = calcTotalEarnings(earnings, weekStart, weekEnd);
  const monthlyEarnings = calcTotalEarnings(earnings, monthStart, monthEnd);

  const pct = parseFloat(pctInput) || 0;
  const baseValue = calcMode === "weekly" ? weeklyEarnings : monthlyEarnings;
  const reserveAmount = (baseValue * pct) / 100;

  const handleSave = async () => {
    await saveConfig({ investmentPercentage: pct, investmentCalcMode: calcMode, investmentMode: investMode });
    if (Platform.OS === "web") alert("Configuração salva!"); else Alert.alert("Sucesso", "Configuração salva!");
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-5 pt-2">
        <Text className="text-lg font-bold text-foreground mb-4">Reserva de Emergência</Text>

        <View className="bg-surface border-2 rounded-2xl p-5 mb-4" style={{ borderColor: colors.success }}>
          <View className="flex-row items-center mb-2">
            <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.success} />
            <Text className="text-lg font-bold text-foreground ml-2">Você deve guardar:</Text>
          </View>
          <Text className="text-3xl font-bold mt-1" style={{ color: colors.success }}>{formatCurrency(reserveAmount)}</Text>
          <Text className="text-sm text-muted mt-1">{calcMode === "weekly" ? "essa semana" : "esse mês"}</Text>
          <View className="mt-3 pt-3 border-t border-border">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-muted">Faturamento {calcMode === "weekly" ? "semanal" : "mensal"}:</Text>
              <Text className="text-xs font-bold text-foreground">{formatCurrency(baseValue)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">Percentual definido:</Text>
              <Text className="text-xs font-bold text-foreground">{pct}%</Text>
            </View>
          </View>
        </View>

        <Card title="Configuração" className="mb-4">
          <Text className="text-xs text-muted mb-2 uppercase">Período de cálculo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
            style={{ marginBottom: 12 }}>
            {(["weekly", "monthly"] as const).map((mode) => (
              <TouchableOpacity key={mode} onPress={() => setCalcMode(mode)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8,
                  backgroundColor: calcMode === mode ? colors.primary : "transparent",
                  borderWidth: 1, borderColor: calcMode === mode ? colors.primary : colors.border,
                }}>
                <Text style={{ color: calcMode === mode ? "#fff" : colors.muted, fontWeight: calcMode === mode ? "700" : "500", fontSize: 12 }}>
                  {mode === "weekly" ? "Semanal" : "Mensal"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text className="text-xs text-muted mb-2 uppercase">Modo de investimento</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
            style={{ marginBottom: 12 }}>
            {(["auto", "manual"] as const).map((mode) => (
              <TouchableOpacity key={mode} onPress={() => setInvestMode(mode)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8,
                  backgroundColor: investMode === mode ? colors.primary : "transparent",
                  borderWidth: 1, borderColor: investMode === mode ? colors.primary : colors.border,
                }}>
                <Text style={{ color: investMode === mode ? "#fff" : colors.muted, fontWeight: investMode === mode ? "700" : "500", fontSize: 12 }}>
                  {mode === "auto" ? "Automático" : "Manual"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text className="text-xs text-muted mb-1 uppercase">Percentual (%)</Text>
          <TextInput className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-3"
            placeholder="10" placeholderTextColor={colors.muted} keyboardType="decimal-pad"
            value={pctInput} onChangeText={setPctInput} returnKeyType="done" />

          <View className="flex-row items-center justify-between bg-background border border-border rounded-xl px-4 py-3 mb-3">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-semibold text-foreground">Incluir na Meta Semanal</Text>
              <Text className="text-xs text-muted">O valor da reserva será adicionado à meta semanal</Text>
            </View>
            <Switch
              value={reserveInGoal}
              onValueChange={async (val) => { setReserveInGoal(val); await saveConfig({ reserveInWeeklyGoal: val }); }}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={reserveInGoal ? "#fff" : colors.muted}
            />
          </View>

          <TouchableOpacity onPress={handleSave}
            style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Salvar Configuração</Text>
          </TouchableOpacity>
        </Card>

        <View className="flex-row gap-3 mb-4">
          <StatCard title="Faturamento Semana" value={formatCurrency(weeklyEarnings)}
            icon={<IconSymbol name="calendar" size={16} color={colors.primary} />} />
          <StatCard title="Faturamento Mês" value={formatCurrency(monthlyEarnings)}
            icon={<IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={colors.success} />} />
        </View>
      </View>
    </ScrollView>
  );
}

// ==================== INVESTIMENTOS ====================
function InvestimentosTab() {
  const { investments, addInvestment, removeInvestment, config } = useData();
  const colors = useColors();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [yieldPct, setYieldPct] = useState("");
  const [date, setDate] = useState(todayFormatted());
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [wallet, setWallet] = useState(config.wallets?.[0]?.name || "");

  const handleSave = async () => {
    if (!name || !value) {
      if (Platform.OS === "web") { alert("Preencha nome e valor"); } else { Alert.alert("Atenção", "Preencha nome e valor"); }
      return;
    }
    await addInvestment({
      name,
      value: parseFloat(value.replace(",", ".")),
      yieldPercentage: parseFloat(yieldPct.replace(",", ".") || "0"),
      date: parseDateInput(date),
      type,
      wallet,
    });
    setName(""); setValue(""); setYieldPct("");
  };

  const totalInvested = calcTotalInvested(investments);
  const sorted = [...investments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthlyData: Record<string, number> = {};
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  let runningTotal = 0;
  const sortedAsc = [...investments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sortedAsc.forEach((inv) => {
    const d = new Date(inv.date);
    const key = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;
    if (inv.type === "deposit") runningTotal += inv.value;
    else runningTotal -= inv.value;
    runningTotal *= 1 + inv.yieldPercentage / 100;
    monthlyData[key] = Math.max(0, runningTotal);
  });

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-5 pt-2">
        <Text className="text-lg font-bold text-foreground mb-4">Investimentos</Text>

        <View className="flex-row gap-3 mb-4">
          <StatCard title="Total Investido" value={formatCurrency(totalInvested)}
            icon={<IconSymbol name="chart.line.uptrend.xyaxis" size={18} color={colors.primary} />} />
          <StatCard title="Operações" value={investments.length.toString()} />
        </View>

        {Object.keys(monthlyData).length > 0 && (
          <Card title="Crescimento dos Investimentos" className="mb-4">
            <SimpleBarChart
              labels={Object.keys(monthlyData)} data={Object.values(monthlyData)}
              height={140} color={colors.primary} showValues
            />
          </Card>
        )}

        <Text className="text-lg font-bold text-foreground mb-3">Novo Registro</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
          style={{ marginBottom: 12 }}>
          {(["deposit", "withdrawal"] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setType(t)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8,
                backgroundColor: type === t ? (t === "deposit" ? colors.success : colors.error) : "transparent",
                borderWidth: 1, borderColor: type === t ? (t === "deposit" ? colors.success : colors.error) : colors.border,
              }}>
              <Text style={{ color: type === t ? "#fff" : colors.muted, fontWeight: type === t ? "700" : "500", fontSize: 12 }}>
                {t === "deposit" ? "Aporte" : "Resgate"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text className="text-xs text-muted mb-1 uppercase">Nome do Investimento</Text>
        <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-3"
          placeholder="Ex: Tesouro Selic" placeholderTextColor={colors.muted}
          value={name} onChangeText={setName} returnKeyType="done" />

        <Text className="text-xs text-muted mb-1 uppercase">Carteira</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {(config.wallets || []).map((w) => (
            <TouchableOpacity key={w.id} onPress={() => setWallet(w.name)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8,
                backgroundColor: wallet === w.name ? colors.primary : colors.surface,
                borderWidth: 1, borderColor: wallet === w.name ? colors.primary : colors.border,
              }}>
              <Text style={{ color: wallet === w.name ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 11 }}>{w.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1 uppercase">Valor (R$)</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad"
              value={value} onChangeText={setValue} returnKeyType="done" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1 uppercase">Rendimento (%)</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="1.0" placeholderTextColor={colors.muted} keyboardType="decimal-pad"
              value={yieldPct} onChangeText={setYieldPct} returnKeyType="done" />
          </View>
        </View>

        <Text className="text-xs text-muted mb-1 uppercase">Data</Text>
        <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          placeholder="DD/MM/AA" placeholderTextColor={colors.muted}
          value={date} onChangeText={setDate} returnKeyType="done" />

        <TouchableOpacity onPress={handleSave}
          style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {type === "deposit" ? "Registrar Aporte" : "Registrar Resgate"}
          </Text>
        </TouchableOpacity>

        <Text className="text-sm font-semibold text-muted mt-5 mb-2 uppercase">Histórico</Text>
        {sorted.map((inv) => (
          <View key={inv.id} className="flex-row items-center bg-surface border border-border rounded-xl p-3 mb-2">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">{inv.name}</Text>
              <Text className="text-xs text-muted">
                {inv.type === "deposit" ? "Aporte" : "Resgate"} • {formatDate(inv.date)} • {inv.yieldPercentage}%
                {inv.wallet ? ` • ${inv.wallet}` : ""}
              </Text>
            </View>
            <Text className="text-base font-bold mr-3"
              style={{ color: inv.type === "deposit" ? colors.success : colors.error }}>
              {inv.type === "deposit" ? "+" : "-"}{formatCurrency(inv.value)}
            </Text>
            <TouchableOpacity onPress={() => removeInvestment(inv.id)} style={{ padding: 4 }}>
              <IconSymbol name="trash.fill" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        {sorted.length === 0 && <Text className="text-sm text-muted text-center py-4">Nenhum investimento registrado</Text>}
      </View>
    </ScrollView>
  );
}
