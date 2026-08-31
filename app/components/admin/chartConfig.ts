import type { ThemeColors } from "../../../contexts/ThemeContext";

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

// Antes era un objeto fijo pensado solo para fondo claro (fondo blanco,
// labels grises). Ahora es una función de los tokens de tema para que los
// charts (LineChart en OverviewCard, PieChart en StatCard) se vean bien
// también en Dark Mode -- fondo/puntos siguen la card, labels siguen
// textSecondary.
export function getChartConfig(colors: ThemeColors) {
  const primary = hexToRgb(colors.primary);
  const secondary = hexToRgb(colors.textSecondary);

  return {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, ${opacity})`,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.card,
    },
  };
}

export const RANK_COLORS = ["#F5A800", "#1A1A1A", "#E53935", "#F5C518", "#BDBDBD"];
