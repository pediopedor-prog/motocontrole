import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency } from "@/lib/calculations";
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";

// ==================== BAR CHART ====================

interface BarChartProps {
  labels: string[];
  data: number[];
  height?: number;
  color?: string;
  secondaryData?: number[];
  secondaryColor?: string;
  barColors?: string[];
  showValues?: boolean;
  showTotal?: boolean;
  formatValue?: (v: number) => string;
}

export function SimpleBarChart({
  labels,
  data,
  height = 150,
  color,
  secondaryData,
  secondaryColor,
  barColors,
  showValues = true,
  showTotal = false,
  formatValue,
}: BarChartProps) {
  const colors = useColors();
  const barColor = color || colors.primary;
  const secColor = secondaryColor || colors.error;
  const fmt = formatValue || ((v: number) => formatCurrency(v));
  const allVals = [...data, ...(secondaryData || [0])];
  const maxVal = Math.max(...allVals, 1);
  const total = data.reduce((s, v) => s + v, 0);

  return (
    <View style={{ height: height + 20 }}>
      {showTotal && total > 0 && (
        <View className="flex-row justify-end mb-1">
          <Text className="text-xs font-bold" style={{ color: colors.success }}>
            Total: {fmt(total)}
          </Text>
        </View>
      )}
      <View className="flex-row items-end justify-between flex-1 px-1">
        {data.map((val, i) => {
          const barH = maxVal > 0 ? (val / maxVal) * (height - 40) : 0;
          const secVal = secondaryData ? secondaryData[i] : 0;
          const secH = maxVal > 0 ? (secVal / maxVal) * (height - 40) : 0;
          const thisColor = barColors ? barColors[i % barColors.length] : barColor;
          return (
            <View key={i} className="items-center flex-1 mx-0.5">
              {showValues && val > 0 && (
                <Text className="text-[7px] text-muted mb-0.5" numberOfLines={1}>
                  {fmt(val)}
                </Text>
              )}
              <View className="flex-row items-end" style={{ height: height - 40 }}>
                <View
                  style={{
                    height: Math.max(barH, 2),
                    backgroundColor: thisColor,
                    borderRadius: 4,
                    width: secondaryData ? 10 : 20,
                    marginRight: secondaryData ? 2 : 0,
                  }}
                />
                {secondaryData && secVal > 0 && (
                  <View
                    style={{
                      height: Math.max(secH, 2),
                      backgroundColor: secColor,
                      borderRadius: 4,
                      width: 10,
                    }}
                  />
                )}
              </View>
              <Text className="text-[9px] text-muted mt-1" numberOfLines={1}>
                {labels[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ==================== GROUPED BAR CHART ====================

interface GroupedBarChartProps {
  labels: string[];
  datasets: {
    data: number[];
    color: string;
    label: string;
  }[];
  height?: number;
  width?: number;
  showValues?: boolean;
  showTotal?: boolean;
  formatValue?: (v: number) => string;
}

export function GroupedBarChart({
  labels,
  datasets,
  height = 200,
  width = 340,
  showValues = true,
  showTotal = false,
  formatValue,
}: GroupedBarChartProps) {
  const colors = useColors();
  const fmt = formatValue || ((v: number) => formatCurrency(v));
  const allValues = datasets.flatMap((d) => d.data);
  const maxVal = Math.max(...allValues, 1);
  const total = allValues.reduce((s, v) => s + v, 0);

  const padding = { top: 25, right: 10, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const groupWidth = chartW / labels.length;
  const barWidth = Math.max(4, Math.min(12, (groupWidth - 4) / datasets.length));

  return (
    <View className="items-center">
      {showTotal && total > 0 && (
        <View className="flex-row justify-end w-full mb-1 pr-2">
          <Text className="text-xs font-bold" style={{ color: colors.success }}>
            Total: {fmt(total)}
          </Text>
        </View>
      )}
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={padding.top + chartH * (1 - pct)}
            x2={width - padding.right}
            y2={padding.top + chartH * (1 - pct)}
            stroke="#2D2D2D"
            strokeWidth={0.5}
          />
        ))}
        {labels.map((label, li) => {
          const groupX = padding.left + li * groupWidth;
          return datasets.map((ds, di) => {
            const val = ds.data[li];
            const barH = (val / maxVal) * chartH;
            const x = groupX + (groupWidth - barWidth * datasets.length) / 2 + di * barWidth;
            const y = padding.top + chartH - barH;
            return (
              <React.Fragment key={`${li}-${di}`}>
                <Rect x={x} y={y} width={barWidth - 1} height={Math.max(barH, 1)} fill={ds.color} rx={2} />
                {showValues && val > 0 && (
                  <SvgText x={x + (barWidth - 1) / 2} y={y - 3} textAnchor="middle" fill="#9CA3AF" fontSize={7}>
                    {fmt(val)}
                  </SvgText>
                )}
              </React.Fragment>
            );
          });
        })}
        {labels.map((label, i) => {
          const labelStep = Math.max(1, Math.floor(labels.length / 10));
          if (i % labelStep !== 0 && i !== labels.length - 1) return null;
          return (
            <SvgText
              key={i}
              x={padding.left + i * groupWidth + groupWidth / 2}
              y={height - 5}
              textAnchor="middle"
              fill="#9CA3AF"
              fontSize={9}
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
      <View className="flex-row flex-wrap justify-center gap-2 mt-2">
        {datasets.map((ds, i) => (
          <View key={i} className="flex-row items-center mr-3">
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: ds.color }} className="mr-1" />
            <Text className="text-xs text-muted">{ds.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ==================== LINE CHART ====================

interface LineChartProps {
  labels: string[];
  datasets: {
    data: number[];
    color: string;
    label: string;
  }[];
  height?: number;
  width?: number;
  showLabels?: boolean;
  showValues?: boolean;
  showTotal?: boolean;
  formatValue?: (v: number) => string;
}

export function SimpleLineChart({
  labels,
  datasets,
  height = 160,
  width = 320,
  showLabels = true,
  showValues = true,
  showTotal = false,
  formatValue,
}: LineChartProps) {
  const themeColors = useColors();
  const fmt = formatValue || ((v: number) => formatCurrency(v));
  const padding = { top: 30, right: 40, bottom: 30, left: 15 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = datasets.flatMap((d) => d.data);
  const maxVal = Math.max(...allValues, 1);

  const getX = (i: number) => padding.left + (i / Math.max(labels.length - 1, 1)) * chartW;
  const getY = (val: number) => padding.top + chartH - (val / maxVal) * chartH;

  const labelStep = Math.max(1, Math.floor(labels.length / 7));

  // Encontra o último ponto com valor > 0 de cada dataset
  const getLastNonZeroIndex = (data: number[]) => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i] > 0) return i;
    }
    return -1;
  };

  return (
    <View className="items-center">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={padding.top + chartH * (1 - pct)}
            x2={width - padding.right}
            y2={padding.top + chartH * (1 - pct)}
            stroke="#2D2D2D"
            strokeWidth={0.5}
          />
        ))}

        {datasets.map((ds, di) => {
          const points = ds.data.map((val, i) => `${getX(i)},${getY(val)}`).join(" ");
          const lastIdx = getLastNonZeroIndex(ds.data);
          const lastVal = lastIdx >= 0 ? ds.data[lastIdx] : 0;
          const lastX = lastIdx >= 0 ? getX(lastIdx) : -1;
          const lastY = lastIdx >= 0 ? getY(lastVal) : -1;

          return (
            <React.Fragment key={di}>
              <Polyline
                points={points}
                fill="none"
                stroke={ds.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {showValues && lastIdx >= 0 && lastVal > 0 && (
                <>
                  <Circle cx={lastX} cy={lastY} r={3} fill={ds.color} />
                  <SvgText
                    x={lastX + 5}
                    y={lastY - 4}
                    fill={ds.color}
                    fontSize={8}
                    fontWeight="bold"
                  >
                    {fmt(lastVal)}
                  </SvgText>
                </>
              )}
            </React.Fragment>
          );
        })}

        {showLabels && labels.map((label, i) => {
          if (i % labelStep !== 0 && i !== labels.length - 1) return null;
          return (
            <SvgText key={i} x={getX(i)} y={height - 5} textAnchor="middle" fill="#9CA3AF" fontSize={9}>
              {label}
            </SvgText>
          );
        })}
      </Svg>

      <View className="flex-row flex-wrap justify-center gap-2 mt-2">
        {datasets.map((ds, i) => (
          <View key={i} className="flex-row items-center mr-3">
            <View style={{ width: 12, height: 3, backgroundColor: ds.color, borderRadius: 2 }} className="mr-1" />
            <Text className="text-xs text-muted">{ds.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ==================== DATE NAVIGATOR ====================

interface DateNavigatorProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

export function DateNavigator({ label, onPrev, onNext }: DateNavigatorProps) {
  return (
    <View className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-3 py-2 mb-3">
      <TouchableOpacity onPress={onPrev} style={{ padding: 6 }}>
        <Text style={{ color: "#4CAF50", fontSize: 18, fontWeight: "bold" }}>{"<"}</Text>
      </TouchableOpacity>
      <Text className="text-sm text-foreground font-semibold">{label}</Text>
      <TouchableOpacity onPress={onNext} style={{ padding: 6 }}>
        <Text style={{ color: "#4CAF50", fontSize: 18, fontWeight: "bold" }}>{">"}</Text>
      </TouchableOpacity>
    </View>
  );
}
