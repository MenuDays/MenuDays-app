export const chartBaseConfig = {
  backgroundGradientFrom: "#FFFFFF",
  backgroundGradientTo: "#FFFFFF",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(245, 168, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#FFFFFF",
  },
};

export const RANK_COLORS = ["#F5A800", "#1A1A1A", "#E53935", "#F5C518", "#BDBDBD"];