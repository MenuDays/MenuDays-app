import { Ionicons } from "@expo/vector-icons";

export type Breakdown = { label: string; value: number; color: string };

export type StatCardData = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  breakdown?: Breakdown[];
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
};

export type RankingRow = { position: number; name: string; value: number; id?: number };