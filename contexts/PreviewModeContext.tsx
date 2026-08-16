import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * "Ver como comensal": un admin o restaurante puede navegar al stack
 * (home) del comensal para revisar cómo se ve la app, sin cerrar su
 * sesión real ni tocar el usuario guardado en AsyncStorage (por eso es
 * puramente de navegación/UI -- el token sigue siendo el mismo, no hay
 * "impersonación" real contra el back). `previewOrigin` guarda desde
 * qué rol se entró, para poder mostrar un banner flotante en (home) con
 * la opción de volver.
 */
export type PreviewOrigin = "administrador" | "restaurante";

interface PreviewModeContextValue {
  previewOrigin: PreviewOrigin | null;
  enterPreview: (origin: PreviewOrigin) => void;
  exitPreview: () => void;
}

const PreviewModeContext = createContext<PreviewModeContextValue | undefined>(undefined);

export function PreviewModeProvider({ children }: { children: React.ReactNode }) {
  const [previewOrigin, setPreviewOrigin] = useState<PreviewOrigin | null>(null);

  const value = useMemo(
    () => ({
      previewOrigin,
      enterPreview: (origin: PreviewOrigin) => setPreviewOrigin(origin),
      exitPreview: () => setPreviewOrigin(null),
    }),
    [previewOrigin]
  );

  return <PreviewModeContext.Provider value={value}>{children}</PreviewModeContext.Provider>;
}

export function usePreviewMode() {
  const ctx = useContext(PreviewModeContext);
  if (!ctx) {
    throw new Error("usePreviewMode debe usarse dentro de PreviewModeProvider");
  }
  return ctx;
}
