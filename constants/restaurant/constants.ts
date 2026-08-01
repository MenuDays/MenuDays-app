// constants.ts

export interface DailyVisit {
  day: string;
  value: number;
}

export interface BreakdownItem {
  label: string;
  value: number;
  max: number;
  display: string;
  gradient: [string, string];
  icon: string;
}

export interface StatItem {
  icon: string;
  value: string;
  label: string;
  gradient: [string, string];
  trend?: string | null;
}

export interface QuickAccessItem {
  icon: string;
  label: string;
  sub: string;
  route: string;
  gradient: [string, string];
}

export const RESTAURANT = {
  name: "Sabor Ecuatoriano",
  status: "Abierto",
  rating: 4.8,
  todayVisits: 247,
  growth: "+18%",
};

export const WEEKLY_VISITS: DailyVisit[] = [
  { day: "L", value: 142 },
  { day: "M", value: 168 },
  { day: "X", value: 155 },
  { day: "J", value: 190 },
  { day: "V", value: 210 },
  { day: "S", value: 231 },
  { day: "D", value: 247 },
];

export const BREAKDOWN: BreakdownItem[] = [
  {
    label: "Reseñas",
    value: 4.8,
    max: 5,
    display: "4.8 / 5",
    icon: "star",
    gradient: ["#FFB800", "#F57C00"],
  },
  {
    label: "Menús activos",
    value: 3,
    max: 5,
    display: "3",
    icon: "restaurant",
    gradient: ["#FFD54F", "#F5A800"],
  },
  {
    label: "Platos publicados",
    value: 12,
    max: 20,
    display: "12",
    icon: "fast-food",
    gradient: ["#FFA726", "#F57C00"],
  },
];

export const STATS: StatItem[] = [
  {
    icon: "eye-outline",
    value: "247",
    label: "Visitas",
    gradient: ["#FFC107", "#F5A800"],
    trend: "+18%",
  },
  {
    icon: "star",
    value: "4.8",
    label: "Reseñas",
    gradient: ["#FF9800", "#F57C00"],
    trend: "+0.2",
  },
  {
    icon: "restaurant-outline",
    value: "3",
    label: "Menús",
    gradient: ["#FFD54F", "#F5A800"],
  },
  {
    icon: "list-outline",
    value: "12",
    label: "Platos",
    gradient: ["#FFA726", "#F57C00"],
  },
];

export const QUICK_ACCESS: QuickAccessItem[] = [
  {
    icon: "restaurant-outline",
    label: "Menú",
    sub: "Editar platos",
    route: "/(restaurant)/menu",
    gradient: ["#FFC107", "#F5A800"],
  },
  {
    icon: "images-outline",
    label: "Galería",
    sub: "Fotos del local",
    route: "/(restaurant)/galeria",
    gradient: ["#FF9800", "#F57C00"],
  },
  {
    icon: "pricetag-outline",
    label: "Promociones",
    sub: "Ofertas activas",
    route: "/(restaurant)/promociones",
    gradient: ["#FFD54F", "#F5A800"],
  },
  {
    icon: "star-outline",
    label: "Reseñas",
    sub: "Opiniones",
    route: "/(restaurant)/resenas",
    gradient: ["#FFA726", "#F57C00"],
  },
];