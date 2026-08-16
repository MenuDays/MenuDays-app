import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../constants/Colors";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedScheme = "light" | "dark";
export type ThemeColors = typeof Colors.light;

const STORAGE_KEY = "@MenuDays:themeMode";
const USER_STORAGE_KEY = "@MenuDays:user";

interface ThemeContextValue {
  /** Preferencia guardada del usuario: "light" | "dark" | "system". */
  mode: ThemeMode;
  /** Esquema efectivo ya resuelto (si mode es "system", sigue al SO). */
  scheme: ResolvedScheme;
  /** Tokens de color para el esquema efectivo actual. */
  colors: ThemeColors;
  isDark: boolean;
  /** Fija una preferencia explícita y la persiste. */
  setMode: (mode: ThemeMode) => void;
  /** Alterna entre claro y oscuro (uso típico del botón de settings). */
  toggleTheme: () => void;
  /** Si todavía no se terminó de leer la preferencia guardada. */
  isLoading: boolean;
  /** Si el rol actual puede usar Dark Mode (solo comensal, ver abajo). */
  allowDarkMode: boolean;
  /** Vuelve a leer el usuario guardado -- llamar después de login/logout
   * para que el lock de rol se actualice sin esperar a un remount. */
  refreshRole: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isLoading, setIsLoading] = useState(true);
  // Dark Mode es una feature solo del rol comensal -- restaurante y admin
  // se quedan siempre en Light, sin importar la preferencia guardada ni
  // el tema del sistema operativo del dispositivo.
  const [allowDarkMode, setAllowDarkMode] = useState(true);

  const refreshRole = () => {
    AsyncStorage.getItem(USER_STORAGE_KEY)
      .then((raw) => {
        if (!raw) {
          setAllowDarkMode(true);
          return;
        }
        try {
          const user = JSON.parse(raw);
          setAllowDarkMode(!user?.rol || user.rol === "comensal");
        } catch {
          setAllowDarkMode(true);
        }
      })
      .catch(() => setAllowDarkMode(true));
  };

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setModeState(saved);
        }
      } catch {
        // Sin preferencia guardada o error de lectura: se sigue con "system".
      } finally {
        setIsLoading(false);
      }
    })();
    refreshRole();
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const toggleTheme = () => {
    const currentlyDark =
      mode === "dark" || (mode === "system" && systemScheme === "dark");
    setMode(currentlyDark ? "light" : "dark");
  };

  const rawScheme: ResolvedScheme =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;
  const scheme: ResolvedScheme = allowDarkMode ? rawScheme : "light";

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      colors: Colors[scheme],
      isDark: scheme === "dark",
      setMode,
      toggleTheme,
      isLoading,
      allowDarkMode,
      refreshRole,
    }),
    [mode, scheme, isLoading, allowDarkMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme debe usarse dentro de un <ThemeProvider>");
  }
  return ctx;
}
