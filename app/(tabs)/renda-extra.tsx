import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card, StatCard } from "@/components/ui/card";
import { SimpleBarChart, SimpleLineChart, DateNavigator } from "@/components/ui/simple-chart";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useData } from "@/lib/data-context";
import { useColors } from "@/hooks/use-colors";
import {
  calcTotalExtraIncome, getStartOfMonth, getEndOfMonth,
  getStartOfWeek, getEndOfWeek, getExtraIncomeMonthlyByType,
  formatCurrency, formatDate, todayFormatted, isInRange,
  parseDateInput, shiftMonth, shiftWeek, formatMonthRange, formatWeekRange,
  shiftYear, formatYearRange,
} from "@/lib/calculations";

const BAR_COLORS = [
  "#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0",
  "#00BCD4", "#FF5722", "#795548", "#607D8B", "#FFC107",
];

const LINE_COLORS = [
  "#4ADE80", "#60A5FA", "#FBBF24", "#F87171", "#A78BFA",
  "#34D399", "#FB923C", "#F472B6", "#38BDF8", "#818CF8",
];

export default function RendaExtraScreen() {
  const { extraIncomes, addExtraIncome, removeExtraIncome } = useData();
  const colors = useColors();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayFormatted());
  const [period, setPeriod] = useState<"week" | "month">("month");
  const [refDate, setRefDate] = useState(new Date());
  const [yearRef, setYearRef] = useState(new Date());

  const handleSave = async () => {
    if (!name || !value) {
      if (Platform.OS === "web") { alert("Preencha nome e valor"); } else { Alert.alert("Atenção", "Preencha nome e valor"); }
      return;
    }
    await addExtraIncome({
      name,
      value: parseFloat(value.replace(",", ".")),
      date: parseDateInput(date),
    });
    setName("");
    setValue("");
  };

  const start = period === "week" ? getStartOfWeek(refDate) : getStartOfMonth(refDate);
  const end = period === "week" ? getEndOfWeek(refDate) : getEndOfMonth(refDate);

  const periodTotal = calcTotalExtraIncome(extraIncomes, start, end);
  const allTotal = calcTotalExtraIncome(extraIncomes);

  const filteredIncomes = extraIncomes.filter((e) => isInRange(e.date, start, end));
  const byName: Record<string, number> = {};
  filteredIncomes.forEach((e) => { byName[e.name] = (byName[e.name] || 0) + e.value; });

  const sorted = [...filteredIncomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const navLabel = period === "week" ? formatWeekRange(refDate) : formatMonthRange(refDate);
  const handlePrev = () => setRefDate(period === "week" ? shiftWeek(refDate, -1) : shiftMonth(refDate, -1));
  const handleNext = () => setRefDate(period === "week" ? shiftWeek(refDate, 1) : shiftMonth(refDate, 1));

  // AJUSTE 5: Gráfico de linha mês a mês por tipo de renda
  const yearData = getExtraIncomeMonthlyByType(extraIncomes, yearRef);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-5 pt-4">
          <Text className="text-2xl font-bold text-foreground mb-4">Renda Extra</Text>

          {/* Período */}
          <View className="flex-row gap-2 mb-3">
            {(["week", "month"] as const).map((p) => (
              <TouchableOpacity key={p} onPress={() => { setPeriod(p); setRefDate(new Date()); }}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                  backgroundColor: period === p ? colors.primary : colors.surface,
                  borderWidth: 1, borderColor: period === p ? colors.primary : colors.border,
                }}>
                <Text style={{ color: period === p ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 13 }}>
                  {p === "week" ? "Semana" : "Mês"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <DateNavigator label={navLabel} onPrev={handlePrev} onNext={handleNext} />

          <View className="flex-row gap-3 mb-4">
            <StatCard title={period === "week" ? "Total da Semana" : "Total do Mês"} value={formatCurrency(periodTotal)}
              icon={<IconSymbol name="plus.circle.fill" size={18} color={colors.success} />} />
            <StatCard title="Total Geral" value={formatCurrency(allTotal)} />
          </View>

          {/* Bar chart por fonte */}
          {Object.keys(byName).length > 0 && (
            <Card title="Rendas Extras por Fonte" className="mb-4">
              <SimpleBarChart
                data={Object.values(byName)} labels={Object.keys(byName)}
                barColors={BAR_COLORS} showValues showTotal height={140}
              />
            </Card>
          )}

          {/* AJUSTE 5: Gráfico de linha mês a mês por tipo */}
          {yearData.datasets.length > 0 && (
            <Card title="Evolução Mensal por Tipo" className="mb-4">
              <DateNavigator label={formatYearRange(yearRef)}
                onPrev={() => setYearRef(shiftYear(yearRef, -1))}
                onNext={() => setYearRef(shiftYear(yearRef, 1))} />
              <SimpleLineChart
                labels={yearData.labels}
                datasets={yearData.datasets.map((ds, i) => ({
                  data: ds.data, color: LINE_COLORS[i % LINE_COLORS.length], label: ds.name,
                }))}
                height={180} width={340} showTotal
              />
            </Card>
          )}

          {/* Form */}
          <Text className="text-lg font-bold text-foreground mb-3">Nova Renda Extra</Text>

          <Text className="text-xs text-muted mb-1 uppercase">Nome / Fonte</Text>
          <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-3"
            placeholder="Ex: Frete particular" placeholderTextColor={colors.muted}
            value={name} onChangeText={setName} returnKeyType="done" />

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1 uppercase">Valor (R$)</Text>
              <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad"
                value={value} onChangeText={setValue} returnKeyType="done" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1 uppercase">Data</Text>
              <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="DD/MM/AA" placeholderTextColor={colors.muted}
                value={date} onChangeText={setDate} returnKeyType="done" />
            </View>
          </View>

          <TouchableOpacity onPress={handleSave}
            style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Salvar Renda Extra</Text>
          </TouchableOpacity>

          {/* History */}
          <Text className="text-sm font-semibold text-muted mt-5 mb-2 uppercase">Histórico</Text>
          {sorted.map((e) => (
            <View key={e.id} className="flex-row items-center bg-surface border border-border rounded-xl p-3 mb-2">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{e.name}</Text>
                <Text className="text-xs text-muted">{formatDate(e.date)}</Text>
              </View>
              <Text className="text-base font-bold mr-3" style={{ color: colors.success }}>
                +{formatCurrency(e.value)}
              </Text>
              <TouchableOpacity onPress={() => removeExtraIncome(e.id)} style={{ padding: 4 }}>
                <IconSymbol name="trash.fill" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {sorted.length === 0 && <Text className="text-sm text-muted text-center py-4">Nenhuma renda extra no período</Text>}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
