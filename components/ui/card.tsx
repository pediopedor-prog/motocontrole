import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function Card({ title, className, children }: CardProps) {
  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
      {title && (
        <Text className="text-sm font-semibold text-muted mb-2 uppercase tracking-wide">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

export function StatCard({ title, value, icon, className }: StatCardProps) {
  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border flex-1", className)}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-medium text-muted uppercase tracking-wide" numberOfLines={1}>
          {title}
        </Text>
        {icon}
      </View>
      <Text className="text-xl font-bold text-foreground" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}
