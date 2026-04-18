import { useState, useMemo } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card, StatCard } from "@/components/ui/card";
import { SimpleBarChart, SimpleLineChart, DateNavigator } from "@/components/ui/simple-chart";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useData } from "@/lib/data-context";
import { useColors } from "@/hooks/use-colors";
import {
  formatCurrency, formatDate, todayFormatted, parseDateInput,
  shiftYear, formatYearRange,
  getStartOfMonth, getEndOfMonth, isInRange,
} from "@/lib/calculations";

type RoloTab = "geral" | "compra" | "venda";

export default function RoloScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<RoloTab>("geral");

  const tabs: { key: RoloTab; label: string }[] = [
    { key: "geral", label: "Geral" },
    { key: "compra", label: "Compra" },
    { key: "venda", label: "Venda" },
  ];

  return (
    <ScreenContainer>
      {/* ===== MENU PADRONIZADO - Estilo pill/chip horizontal (mesmo da aba Geral) ===== */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {tabs.map((tab) => (
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
      {activeTab === "geral" && <GeralTab />}
      {activeTab === "compra" && <CompraTab />}
      {activeTab === "venda" && <VendaTab />}
    </ScreenContainer>
  );
}

/* ============================================================
   ABA GERAL
   ============================================================ */
function GeralTab() {
  const { roloProducts, roloSales, roloWithdrawals, addRoloWithdrawal, config, saveConfig } = useData();
  const colors = useColors();
  const [yearRef, setYearRef] = useState(new Date());
  const [withdrawValue, setWithdrawValue] = useState("");
  const [withdrawDesc, setWithdrawDesc] = useState("");
  const [editingInitialBalance, setEditingInitialBalance] = useState(false);
  const [initialBalanceInput, setInitialBalanceInput] = useState(
    (config.roloInitialBalance || 0).toFixed(2).replace(".", ",")
  );

  const roloInitialBalance = config.roloInitialBalance || 0;

  const totalGasto = useMemo(() => {
    return roloProducts
      .filter((p) => (p as any).status !== "pending")
      .reduce((s, p) => s + (p.purchasePrice * p.quantity), 0);
  }, [roloProducts]);

  const totalGanho = useMemo(() => {
    return roloSales.reduce((s, sale) => s + sale.totalValue, 0);
  }, [roloSales]);

  const totalSaques = useMemo(() => {
    return roloWithdrawals.reduce((s, w) => s + w.value, 0);
  }, [roloWithdrawals]);

  const saldo = roloInitialBalance + totalGanho - totalGasto - totalSaques;
  const ganhoLiquido = totalGanho - totalGasto;

  const dinheiroParado = useMemo(() => {
    return roloProducts
      .filter((p) => (p as any).status !== "pending")
      .reduce((s, p) => {
        const remaining = p.quantity - p.quantitySold;
        return s + (remaining > 0 ? remaining * p.purchasePrice : 0);
      }, 0);
  }, [roloProducts]);

  const potencialGanho = useMemo(() => {
    return roloProducts
      .filter((p) => (p as any).status !== "pending")
      .reduce((s, p) => {
        const remaining = p.quantity - p.quantitySold;
        return s + (remaining > 0 ? remaining * p.suggestedSalePrice : 0);
      }, 0);
  }, [roloProducts]);

  const totalPendente = useMemo(() => {
    return roloProducts
      .filter((p) => (p as any).status === "pending")
      .reduce((s, p) => s + (p.purchasePrice * p.quantity), 0);
  }, [roloProducts]);

  const qtdPendente = useMemo(() => {
    return roloProducts.filter((p) => (p as any).status === "pending").length;
  }, [roloProducts]);

  const crescimento = totalGasto > 0 ? ((totalGanho - totalGasto) / totalGasto) * 100 : 0;

  const year = yearRef.getFullYear();
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const monthlyData = useMemo(() => {
    const gastosData = new Array(12).fill(0);
    const ganhosData = new Array(12).fill(0);
    const lucroData = new Array(12).fill(0);

    roloProducts.forEach((p) => {
      const d = new Date(p.date + "T12:00:00");
      if (d.getFullYear() === year) {
        gastosData[d.getMonth()] += p.purchasePrice * p.quantity;
      }
    });

    roloSales.forEach((s) => {
      const d = new Date(s.date + "T12:00:00");
      if (d.getFullYear() === year) {
        ganhosData[d.getMonth()] += s.totalValue;
      }
    });

    for (let i = 0; i < 12; i++) {
      lucroData[i] = ganhosData[i] - gastosData[i];
    }

    const lucroAcum = new Array(12).fill(0);
    let acumulado = roloInitialBalance;
    for (let i = 0; i < 12; i++) {
      acumulado += ganhosData[i] - gastosData[i];
      lucroAcum[i] = acumulado;
    }

    return { gastosData, ganhosData, lucroData, lucroAcum };
  }, [roloProducts, roloSales, year, roloInitialBalance]);

  const handleSaque = async () => {
    if (!withdrawValue) {
      if (Platform.OS === "web") alert("Informe o valor do saque");
      else Alert.alert("Atenção", "Informe o valor do saque");
      return;
    }
    const val = parseFloat(withdrawValue.replace(",", "."));
    if (val > saldo) {
      if (Platform.OS === "web") alert("Saldo insuficiente no Rolo");
      else Alert.alert("Atenção", "Saldo insuficiente no Rolo");
      return;
    }
    await addRoloWithdrawal({
      value: val,
      description: withdrawDesc || "Saque para saldo geral",
      date: new Date().toISOString().split("T")[0],
    });
    setWithdrawValue("");
    setWithdrawDesc("");
    if (Platform.OS === "web") alert(`Saque de ${formatCurrency(val)} realizado!`);
    else Alert.alert("Sucesso", `Saque de ${formatCurrency(val)} realizado!`);
  };

  const handleSaveInitialBalance = async () => {
    const val = parseFloat(initialBalanceInput.replace(",", ".")) || 0;
    await saveConfig({ roloInitialBalance: val });
    setEditingInitialBalance(false);
    if (Platform.OS === "web") alert("Saldo inicial salvo!");
    else Alert.alert("Sucesso", "Saldo inicial salvo!");
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-5 pt-2">

        {/* Card Fluxo de Caixa */}
        <View className="bg-surface border-2 rounded-2xl p-4 mb-4"
          style={{ borderColor: saldo >= 0 ? colors.success : colors.error }}>
          <Text className="text-sm font-bold text-muted mb-2 uppercase">Fluxo de Caixa</Text>
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-muted">Saldo Inicial:</Text>
            <Text className="text-xs font-bold text-foreground">{formatCurrency(roloInitialBalance)}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-muted">Total Vendas (entradas):</Text>
            <Text className="text-xs font-bold" style={{ color: colors.success }}>+{formatCurrency(totalGanho)}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-muted">Total Compras (saídas):</Text>
            <Text className="text-xs font-bold" style={{ color: colors.error }}>-{formatCurrency(totalGasto)}</Text>
          </View>
          {totalSaques > 0 && (
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-muted">Saques:</Text>
              <Text className="text-xs font-bold" style={{ color: colors.warning }}>-{formatCurrency(totalSaques)}</Text>
            </View>
          )}
          <View className="border-t border-border mt-2 pt-2 flex-row justify-between">
            <Text className="text-sm font-bold text-foreground">Saldo Atual:</Text>
            <Text className="text-lg font-bold" style={{ color: saldo >= 0 ? colors.success : colors.error }}>
              {formatCurrency(saldo)}
            </Text>
          </View>
        </View>

        {/* Card produtos a caminho */}
        {qtdPendente > 0 && (
          <View className="bg-surface border rounded-2xl p-4 mb-4" style={{ borderColor: colors.warning }}>
            <View className="flex-row items-center mb-1">
              <IconSymbol name="clock.fill" size={16} color={colors.warning} />
              <Text className="text-sm font-bold ml-2" style={{ color: colors.warning }}>
                {qtdPendente} {qtdPendente === 1 ? "compra aguardando" : "compras aguardando"} chegada
              </Text>
            </View>
            <Text className="text-xs text-muted">
              Total investido aguardando: {formatCurrency(totalPendente)} — ainda não entra no estoque nem no saldo.
            </Text>
          </View>
        )}

        {/* Saldo Inicial */}
        <Card title="Saldo Inicial do Rolo" className="mb-4">
          <Text className="text-xs text-muted mb-2">
            Configure o valor inicial de caixa para calcular o fluxo corretamente.
          </Text>
          {editingInitialBalance ? (
            <>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-2"
                placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad"
                value={initialBalanceInput} onChangeText={setInitialBalanceInput} returnKeyType="done"
              />
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={handleSaveInitialBalance}
                  style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Salvar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingInitialBalance(false)}
                  style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">{formatCurrency(roloInitialBalance)}</Text>
              <TouchableOpacity onPress={() => setEditingInitialBalance(true)}
                style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Editar</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Cards de resumo */}
        <View className="flex-row gap-3 mb-3">
          <StatCard title="Ganho Líquido" value={formatCurrency(ganhoLiquido)}
            icon={<IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={ganhoLiquido >= 0 ? colors.success : colors.error} />} />
          <StatCard title="Crescimento" value={`${crescimento.toFixed(1)}%`}
            icon={<IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={crescimento >= 0 ? colors.success : colors.error} />} />
        </View>
        <View className="flex-row gap-3 mb-3">
          <StatCard title="Dinheiro Parado" value={formatCurrency(dinheiroParado)}
            icon={<IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.warning} />} />
          <StatCard title="Potencial de Ganho" value={formatCurrency(potencialGanho)}
            icon={<IconSymbol name="arrow.up.circle.fill" size={16} color={colors.success} />} />
        </View>
        <View className="flex-row gap-3 mb-4">
          <StatCard title="Total Comprado" value={formatCurrency(totalGasto)}
            icon={<IconSymbol name="cart.fill" size={16} color={colors.error} />} />
          <StatCard title="Total Vendido" value={formatCurrency(totalGanho)}
            icon={<IconSymbol name="tag.fill" size={16} color={colors.success} />} />
        </View>

        {/* Gráfico Lucro por Mês */}
        {monthlyData.lucroData.some((v: number) => v !== 0) && (
          <Card title="Lucro por Mês" className="mb-4">
            <DateNavigator label={formatYearRange(yearRef)}
              onPrev={() => setYearRef(shiftYear(yearRef, -1))}
              onNext={() => setYearRef(shiftYear(yearRef, 1))} />
            <SimpleBarChart
              labels={monthNames}
              data={monthlyData.lucroData.map((v: number) => Math.max(0, v))}
              color="#4ADE80"
              height={160} showValues
              formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')}k` : Math.round(v).toString()}
            />
          </Card>
        )}

        {/* Gráfico Lucro Acumulado */}
        {monthlyData.lucroAcum.some((v) => v !== 0) && (
          <Card title="Lucro Acumulado" className="mb-4">
            <DateNavigator label={formatYearRange(yearRef)}
              onPrev={() => setYearRef(shiftYear(yearRef, -1))}
              onNext={() => setYearRef(shiftYear(yearRef, 1))} />
            <SimpleLineChart
              labels={monthNames}
              datasets={[{ data: monthlyData.lucroAcum, color: "#4ADE80", label: "Lucro Acumulado" }]}
              height={180} width={340} showValues
              formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')}k` : Math.round(v).toString()}
            />
          </Card>
        )}

        {/* Gráfico Gastos vs Ganhos */}
        {(monthlyData.gastosData.some((v) => v !== 0) || monthlyData.ganhosData.some((v) => v !== 0)) && (
          <Card title="Compras vs Vendas (Mensal)" className="mb-4">
            <SimpleBarChart
              labels={monthNames}
              data={monthlyData.ganhosData}
              secondaryData={monthlyData.gastosData}
              color="#4ADE80"
              secondaryColor="#F87171"
              height={180} showValues
              formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')}k` : Math.round(v).toString()}
            />
          </Card>
        )}

        {/* Saque */}
        <Card title="Retirar do Caixa do Rolo" className="mb-4">
          <Text className="text-xs text-muted mb-2">
            Registre uma retirada do caixa do Rolo.
          </Text>
          <Text className="text-xs text-muted mb-1 uppercase">Descrição</Text>
          <TextInput className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-2"
            placeholder="Ex: Lucro da semana" placeholderTextColor={colors.muted}
            value={withdrawDesc} onChangeText={setWithdrawDesc} returnKeyType="done" />
          <Text className="text-xs text-muted mb-1 uppercase">Valor (R$)</Text>
          <TextInput className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-3"
            placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad"
            value={withdrawValue} onChangeText={setWithdrawValue} returnKeyType="done" />
          <TouchableOpacity onPress={handleSaque}
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Realizar Retirada</Text>
          </TouchableOpacity>
        </Card>

        {/* Histórico de saques */}
        {roloWithdrawals.length > 0 && (
          <>
            <Text className="text-sm font-semibold text-muted mb-2 uppercase">Retiradas Realizadas</Text>
            {[...roloWithdrawals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((w) => (
              <View key={w.id} className="flex-row items-center bg-surface border border-border rounded-xl p-3 mb-2">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{w.description}</Text>
                  <Text className="text-xs text-muted">{formatDate(w.date)}</Text>
                </View>
                <Text className="text-sm font-bold mr-2" style={{ color: colors.warning }}>
                  -{formatCurrency(w.value)}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

/* ============================================================
   ABA COMPRA
   - Clicar em produto cadastrado preenche o formulário
   - Produto duplicado: soma quantidade + média de custo ponderada
   ============================================================ */
function CompraTab() {
  const { roloProducts, addRoloProduct, updateRoloProduct, removeRoloProduct } = useData();
  const colors = useColors();
  const [name, setName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [profitMargin, setProfitMargin] = useState("50");
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [date, setDate] = useState(todayFormatted());
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [jaChegou, setJaChegou] = useState(true); // true = produto já chegou, false = aguardando

  // Produtos aguardando chegada
  const pendingProducts = useMemo(() => {
    return roloProducts.filter((p) => (p as any).status === "pending");
  }, [roloProducts]);

  // Dar baixa: muda status para received
  const handleConfirmarChegada = (product: typeof roloProducts[0]) => {
    const doConfirm = async () => {
      await updateRoloProduct(product.id, { status: "received" } as any);
      if (Platform.OS === "web") alert(`"${product.name}" confirmado no estoque!`);
      else Alert.alert("Chegou!", `"${product.name}" entrou no estoque.`);
    };
    if (Platform.OS === "web") {
      if (confirm(`Confirmar chegada de "${product.name}" (${product.quantity} un)?`)) doConfirm();
    } else {
      Alert.alert(
        "Confirmar Chegada",
        `"${product.name}" chegou?\n${product.quantity} unidade(s) • ${formatCurrency(product.purchasePrice)} cada`,
        [
          { text: "Ainda não", style: "cancel" },
          { text: "Chegou! ✓", onPress: doConfirm },
        ]
      );
    }
  };

  const calcSuggestedPrice = () => {
    const price = parseFloat(purchasePrice.replace(",", ".")) || 0;
    const margin = parseFloat(profitMargin.replace(",", ".")) || 0;
    const suggested = price + (price * margin / 100);
    setSuggestedPrice(suggested.toFixed(2).replace(".", ","));
  };

  // Verifica se já existe produto com mesmo nome (ignora o próprio produto em edição)
  const existingProduct = useMemo(() => {
    if (!name.trim()) return null;
    return roloProducts.find(
      (p) => p.name.toLowerCase().trim() === name.toLowerCase().trim() && p.id !== editingProductId
    ) || null;
  }, [name, roloProducts, editingProductId]);

  // Clicou num produto do estoque -> preenche o formulário
  const handleSelectProduct = (product: typeof roloProducts[0]) => {
    setEditingProductId(product.id);
    setName(product.name);
    setPurchasePrice(product.purchasePrice.toFixed(2).replace(".", ","));
    setSuggestedPrice(product.suggestedSalePrice.toFixed(2).replace(".", ","));
    setQuantity("1");
    const margin = product.purchasePrice > 0
      ? ((product.suggestedSalePrice - product.purchasePrice) / product.purchasePrice) * 100
      : 0;
    setProfitMargin(margin.toFixed(0));
    setDate(todayFormatted());
  };

  // Limpa o formulário
  const handleClearForm = () => {
    setEditingProductId(null);
    setName("");
    setPurchasePrice("");
    setQuantity("1");
    setProfitMargin("50");
    setSuggestedPrice("");
    setDate(todayFormatted());
  };

  const handleSave = async () => {
    if (!name || !purchasePrice || !quantity) {
      if (Platform.OS === "web") alert("Preencha todos os campos obrigatórios");
      else Alert.alert("Atenção", "Preencha todos os campos obrigatórios");
      return;
    }

    const newPrice = parseFloat(purchasePrice.replace(",", "."));
    const newQty = parseInt(quantity) || 1;
    const margin = parseFloat(profitMargin.replace(",", ".")) || 0;
    const salePrice = suggestedPrice
      ? parseFloat(suggestedPrice.replace(",", "."))
      : newPrice + (newPrice * margin / 100);

    // Verifica se estamos adicionando a um produto existente
    const targetProduct = editingProductId
      ? roloProducts.find((p) => p.id === editingProductId)
      : existingProduct;

    if (targetProduct) {
      // ===== PRODUTO JÁ EXISTE: Somar quantidade + Média de custo ponderada =====
      const oldQty = targetProduct.quantity;
      const oldCost = targetProduct.purchasePrice;
      const totalQty = oldQty + newQty;

      // Média de custo ponderada: (custoAntigoTotal + custoNovoTotal) / qtdTotal
      const avgCost = (oldCost * oldQty + newPrice * newQty) / totalQty;

      await updateRoloProduct(targetProduct.id, {
        quantity: totalQty,
        purchasePrice: Math.round(avgCost * 100) / 100,
        suggestedSalePrice: salePrice,
        profitMargin: avgCost > 0 ? ((salePrice - avgCost) / avgCost) * 100 : 0,
      });

      handleClearForm();

      const msg = `"${targetProduct.name}" atualizado!\n\nEstoque: ${oldQty} + ${newQty} = ${totalQty} un\nCusto médio: ${formatCurrency(oldCost)} → ${formatCurrency(avgCost)}\nPreço de venda: ${formatCurrency(salePrice)}`;
      if (Platform.OS === "web") alert(msg);
      else Alert.alert("Estoque Atualizado", msg);
    } else {
      // ===== PRODUTO NOVO: Cadastrar normalmente =====
      await addRoloProduct({
        name,
        purchasePrice: newPrice,
        quantity: newQty,
        quantitySold: 0,
        suggestedSalePrice: salePrice,
        profitMargin: margin,
        date: parseDateInput(date),
        status: jaChegou ? "received" : "pending",
      } as any);

      handleClearForm();

      if (jaChegou) {
        if (Platform.OS === "web") alert("Produto cadastrado no estoque!");
        else Alert.alert("Sucesso", "Produto cadastrado no estoque!");
      } else {
        if (Platform.OS === "web") alert("Compra registrada! Dê baixa quando o produto chegar.");
        else Alert.alert("Compra Registrada", "Dê baixa quando o produto chegar na aba Compra.");
      }
    }
  };

  const handleDelete = (product: typeof roloProducts[0]) => {
    const doDelete = () => removeRoloProduct(product.id);
    if (Platform.OS === "web") {
      if (confirm(`Excluir "${product.name}"?`)) doDelete();
    } else {
      Alert.alert("Confirmar", `Excluir "${product.name}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const sorted = [...roloProducts]
    .filter((p) => (p as any).status !== "pending")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-5 pt-2">

        {/* Título + botão limpar */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-foreground">
            {editingProductId ? "Adicionar ao Estoque" : "Nova Compra"}
          </Text>
          {editingProductId && (
            <TouchableOpacity onPress={handleClearForm}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}>
              <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 11 }}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Aviso se produto já existe (digitando nome igual) */}
        {existingProduct && !editingProductId && (
          <View className="bg-surface border rounded-xl p-3 mb-3"
            style={{ borderColor: "#F59E0B" }}>
            <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "700" }}>
              Produto já existe no estoque
            </Text>
            <Text className="text-xs text-muted mt-1">
              Estoque atual: {existingProduct.quantity - existingProduct.quantitySold} un | Custo médio: {formatCurrency(existingProduct.purchasePrice)}
            </Text>
            <Text className="text-xs text-muted">
              Ao salvar, a quantidade será somada e o custo médio recalculado.
            </Text>
          </View>
        )}

        {/* Aviso quando editando produto selecionado */}
        {editingProductId && (() => {
          const prod = roloProducts.find((p) => p.id === editingProductId);
          if (!prod) return null;
          const remaining = prod.quantity - prod.quantitySold;
          return (
            <View className="bg-surface border rounded-xl p-3 mb-3"
              style={{ borderColor: colors.primary }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
                Adicionando ao: {prod.name}
              </Text>
              <Text className="text-xs text-muted mt-1">
                Estoque atual: {remaining} un (total: {prod.quantity}) | Custo médio: {formatCurrency(prod.purchasePrice)} | Venda: {formatCurrency(prod.suggestedSalePrice)}
              </Text>
              <Text className="text-xs text-muted">
                Informe a quantidade e o preço pago nesta compra. O custo médio será recalculado automaticamente.
              </Text>
            </View>
          );
        })()}

        <Text className="text-xs text-muted mb-1 uppercase">Nome do Produto</Text>
        <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-3"
          placeholder="Ex: Capinha de celular" placeholderTextColor={colors.muted}
          value={name} onChangeText={(text) => { setName(text); if (editingProductId) setEditingProductId(null); }}
          returnKeyType="done" />

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1 uppercase">Preço de Custo (R$)</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad"
              value={purchasePrice} onChangeText={setPurchasePrice} returnKeyType="done"
              onBlur={calcSuggestedPrice} />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1 uppercase">Quantidade</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="1" placeholderTextColor={colors.muted} keyboardType="number-pad"
              value={quantity} onChangeText={setQuantity} returnKeyType="done" />
          </View>
        </View>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1 uppercase">Margem de Lucro (%)</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="50" placeholderTextColor={colors.muted} keyboardType="decimal-pad"
              value={profitMargin} onChangeText={setProfitMargin} returnKeyType="done"
              onBlur={calcSuggestedPrice} />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1 uppercase">Preço de Venda (R$)</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Sugerido" placeholderTextColor={colors.muted} keyboardType="decimal-pad"
              value={suggestedPrice} onChangeText={setSuggestedPrice} returnKeyType="done" />
          </View>
        </View>

        <Text className="text-xs text-muted mb-1 uppercase">Data da Compra</Text>
        <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-3"
          placeholder="DD/MM/AA" placeholderTextColor={colors.muted}
          value={date} onChangeText={setDate} returnKeyType="done" />

        {/* Toggle: produto já chegou? */}
        {!editingProductId && !existingProduct && (
          <View className="mb-3">
            <Text className="text-xs text-muted mb-2 uppercase">Status do Produto</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setJaChegou(true)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                  backgroundColor: jaChegou ? colors.success : colors.surface,
                  borderWidth: 1, borderColor: jaChegou ? colors.success : colors.border,
                }}>
                <Text style={{ color: jaChegou ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 12 }}>
                  ✓ Já chegou
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setJaChegou(false)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                  backgroundColor: !jaChegou ? colors.warning : colors.surface,
                  borderWidth: 1, borderColor: !jaChegou ? colors.warning : colors.border,
                }}>
                <Text style={{ color: !jaChegou ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 12 }}>
                  ⏳ Aguardando
                </Text>
              </TouchableOpacity>
            </View>
            {!jaChegou && (
              <Text className="text-xs text-muted mt-2">
                O produto será registrado como pendente. Dê baixa quando ele chegar para entrar no estoque.
              </Text>
            )}
          </View>
        )}

        {/* Resumo da compra */}
        {purchasePrice && quantity && (() => {
          const price = parseFloat(purchasePrice.replace(",", ".") || "0");
          const qty = parseInt(quantity) || 1;
          const totalCompra = price * qty;
          const targetProd = editingProductId
            ? roloProducts.find((p) => p.id === editingProductId)
            : existingProduct;

          if (targetProd) {
            const oldQty = targetProd.quantity;
            const oldCost = targetProd.purchasePrice;
            const newTotalQty = oldQty + qty;
            const avgCost = (oldCost * oldQty + price * qty) / newTotalQty;
            return (
              <View className="bg-surface border border-border rounded-xl p-3 mb-3">
                <Text className="text-xs text-muted">
                  Total desta compra: {formatCurrency(totalCompra)}
                </Text>
                <Text className="text-xs font-semibold mt-1" style={{ color: colors.primary }}>
                  Novo custo médio: {formatCurrency(oldCost)} → {formatCurrency(avgCost)}
                </Text>
                <Text className="text-xs text-muted">
                  Novo estoque total: {oldQty} + {qty} = {newTotalQty} un
                </Text>
              </View>
            );
          }

          return (
            <View className="bg-surface border border-border rounded-xl p-3 mb-3">
              <Text className="text-xs text-muted">
                Total da compra: {formatCurrency(totalCompra)}
                {suggestedPrice ? ` | Venda estimada: ${formatCurrency(parseFloat(suggestedPrice.replace(",", ".") || "0") * qty)}` : ""}
              </Text>
            </View>
          );
        })()}

        <TouchableOpacity onPress={handleSave}
          style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {editingProductId || existingProduct ? "Adicionar ao Estoque" : "Cadastrar Compra"}
          </Text>
        </TouchableOpacity>

        {/* Seção: Aguardando Chegada */}
        {pendingProducts.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <IconSymbol name="clock.fill" size={14} color={colors.warning} />
              <Text className="text-sm font-semibold ml-2 uppercase" style={{ color: colors.warning }}>
                Aguardando Chegada ({pendingProducts.length})
              </Text>
            </View>
            {pendingProducts.map((p) => (
              <View key={p.id} className="bg-surface border rounded-xl p-3 mb-2"
                style={{ borderColor: colors.warning }}>
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{p.name}</Text>
                    <Text className="text-xs text-muted">
                      {p.quantity} un • {formatCurrency(p.purchasePrice)} cada • Comprado em {formatDate(p.date)}
                    </Text>
                    <Text className="text-xs text-muted">
                      Total: {formatCurrency(p.purchasePrice * p.quantity)} • Venda: {formatCurrency(p.suggestedSalePrice)}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <TouchableOpacity onPress={() => handleConfirmarChegada(p)}
                      style={{ backgroundColor: colors.success, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Chegou ✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(p)} style={{ padding: 4 }}>
                      <IconSymbol name="trash.fill" size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Lista de Estoque - clicável */}
        <Text className="text-sm font-semibold text-muted mt-1 mb-2 uppercase">
          Estoque (toque para adicionar)
        </Text>
        {sorted.map((p) => {
          const remaining = p.quantity - p.quantitySold;
          const isSelected = editingProductId === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.7}
              onPress={() => handleSelectProduct(p)}
              style={{
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? colors.primary : colors.border,
              }}
              className="bg-surface rounded-xl p-3 mb-2"
            >
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: isSelected ? colors.primary : colors.foreground }}>
                    {p.name}
                  </Text>
                  <Text className="text-xs text-muted">
                    Custo médio: {formatCurrency(p.purchasePrice)} | Venda: {formatCurrency(p.suggestedSalePrice)}
                  </Text>
                  <Text className="text-xs" style={{ color: remaining > 0 ? colors.warning : colors.success }}>
                    Estoque: {remaining}/{p.quantity} {remaining === 0 ? "(Vendido)" : ""}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(p)} style={{ padding: 4 }}>
                  <IconSymbol name="trash.fill" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
        {sorted.length === 0 && <Text className="text-sm text-muted text-center py-4">Nenhum produto cadastrado</Text>}
      </View>
    </ScrollView>
  );
}

/* ============================================================
   ABA VENDA
   ============================================================ */
function VendaTab() {
  const { roloProducts, roloSales, addRoloSale, removeRoloSale, updateRoloProduct } = useData();
  const colors = useColors();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [salePrice, setSalePrice] = useState("");
  const [date, setDate] = useState(todayFormatted());

  const availableProducts = roloProducts.filter((p) => p.quantity - p.quantitySold > 0 && (p as any).status !== "pending");

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    const product = roloProducts.find((p) => p.id === id);
    if (product) {
      setSalePrice(product.suggestedSalePrice.toFixed(2).replace(".", ","));
    }
  };

  const handleSale = async () => {
    if (!selectedProductId || !saleQuantity || !salePrice) {
      if (Platform.OS === "web") alert("Selecione um produto e preencha os campos");
      else Alert.alert("Atenção", "Selecione um produto e preencha os campos");
      return;
    }
    const product = roloProducts.find((p) => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(saleQuantity) || 1;
    const remaining = product.quantity - product.quantitySold;
    if (qty > remaining) {
      if (Platform.OS === "web") alert(`Estoque insuficiente. Disponível: ${remaining}`);
      else Alert.alert("Atenção", `Estoque insuficiente. Disponível: ${remaining}`);
      return;
    }

    const price = parseFloat(salePrice.replace(",", "."));
    const totalValue = price * qty;

    await addRoloSale({
      productId: product.id,
      productName: product.name,
      quantity: qty,
      salePrice: price,
      totalValue,
      date: parseDateInput(date),
    });

    await updateRoloProduct(product.id, {
      quantitySold: product.quantitySold + qty,
    });

    setSaleQuantity("1");
    setSalePrice("");
    setSelectedProductId("");
    if (Platform.OS === "web") alert(`Venda de ${qty}x ${product.name} registrada! +${formatCurrency(totalValue)} no caixa.`);
    else Alert.alert("Sucesso", `Venda de ${qty}x ${product.name} registrada!\n+${formatCurrency(totalValue)} no caixa.`);
  };

  const handleDeleteSale = (sale: typeof roloSales[0]) => {
    const doDelete = async () => {
      const product = roloProducts.find((p) => p.id === sale.productId);
      if (product) {
        await updateRoloProduct(product.id, {
          quantitySold: Math.max(0, product.quantitySold - sale.quantity),
        });
      }
      await removeRoloSale(sale.id);
    };
    if (Platform.OS === "web") {
      if (confirm(`Excluir venda de "${sale.productName}"? O estoque será restaurado.`)) doDelete();
    } else {
      Alert.alert("Confirmar", `Excluir venda de "${sale.productName}"? O estoque será restaurado.`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const sortedSales = [...roloSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-5 pt-2">
        <Text className="text-lg font-bold text-foreground mb-3">Nova Venda</Text>

        <Text className="text-xs text-muted mb-1 uppercase">Selecionar Produto</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {availableProducts.map((p) => {
            const remaining = p.quantity - p.quantitySold;
            return (
              <TouchableOpacity key={p.id} onPress={() => handleSelectProduct(p.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8,
                  backgroundColor: selectedProductId === p.id ? colors.primary : colors.surface,
                  borderWidth: 1, borderColor: selectedProductId === p.id ? colors.primary : colors.border,
                  minWidth: 100,
                }}>
                <Text style={{ color: selectedProductId === p.id ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>
                  {p.name}
                </Text>
                <Text style={{ color: selectedProductId === p.id ? "#fff" : colors.muted, fontSize: 10 }}>
                  Estoque: {remaining} | {formatCurrency(p.suggestedSalePrice)}
                </Text>
                <Text style={{ color: selectedProductId === p.id ? "#fff" : colors.muted, fontSize: 10 }}>
                  Custo: {formatCurrency(p.purchasePrice)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {availableProducts.length === 0 && (
          <Text className="text-sm text-muted text-center py-4 mb-3">Nenhum produto com estoque disponível</Text>
        )}

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1 uppercase">Quantidade</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="1" placeholderTextColor={colors.muted} keyboardType="number-pad"
              value={saleQuantity} onChangeText={setSaleQuantity} returnKeyType="done" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1 uppercase">Preço de Venda (R$)</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="0,00" placeholderTextColor={colors.muted} keyboardType="decimal-pad"
              value={salePrice} onChangeText={setSalePrice} returnKeyType="done" />
          </View>
        </View>

        <Text className="text-xs text-muted mb-1 uppercase">Data da Venda</Text>
        <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-3"
          placeholder="DD/MM/AA" placeholderTextColor={colors.muted}
          value={date} onChangeText={setDate} returnKeyType="done" />

        {selectedProductId && salePrice && saleQuantity && (() => {
          const product = roloProducts.find((p) => p.id === selectedProductId);
          const price = parseFloat(salePrice.replace(",", ".") || "0");
          const qty = parseInt(saleQuantity) || 1;
          const total = price * qty;
          const lucro = product ? (price - product.purchasePrice) * qty : 0;
          return (
            <View className="bg-surface border border-border rounded-xl p-3 mb-3">
              <Text className="text-xs text-muted">Total da venda: {formatCurrency(total)}</Text>
              {product && (
                <Text className="text-xs mt-1" style={{ color: lucro >= 0 ? colors.success : colors.error }}>
                  Lucro estimado: {formatCurrency(lucro)} ({product.purchasePrice > 0 ? (((price - product.purchasePrice) / product.purchasePrice) * 100).toFixed(1) : "0"}%)
                </Text>
              )}
            </View>
          );
        })()}

        <TouchableOpacity onPress={handleSale}
          style={{ backgroundColor: colors.success, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Registrar Venda</Text>
        </TouchableOpacity>

        <Text className="text-sm font-semibold text-muted mt-5 mb-2 uppercase">Histórico de Vendas</Text>
        {sortedSales.map((sale) => {
          const product = roloProducts.find((p) => p.id === sale.productId);
          const lucroUnit = product ? sale.salePrice - product.purchasePrice : 0;
          const lucroTotal = lucroUnit * sale.quantity;
          return (
            <View key={sale.id} className="bg-surface border border-border rounded-xl p-3 mb-2">
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {sale.productName} ({sale.quantity}x)
                  </Text>
                  <Text className="text-xs text-muted">
                    {formatDate(sale.date)} | Preço: {formatCurrency(sale.salePrice)} | Total: {formatCurrency(sale.totalValue)}
                  </Text>
                  <Text className="text-xs" style={{ color: lucroTotal >= 0 ? colors.success : colors.error }}>
                    Lucro: {formatCurrency(lucroTotal)} ({product && product.purchasePrice > 0 ? ((lucroUnit / product.purchasePrice) * 100).toFixed(1) : "0"}%)
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteSale(sale)} style={{ padding: 4 }}>
                  <IconSymbol name="trash.fill" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {sortedSales.length === 0 && <Text className="text-sm text-muted text-center py-4">Nenhuma venda registrada</Text>}
      </View>
    </ScrollView>
  );
}
