import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// ==========================================================================
// Error Boundary GLOBAL.
//
// Si CUALQUIER componente tira una excepción durante el render / en un
// método de ciclo de vida (cosa que en un dispositivo puntual puede pasar
// por un módulo nativo que falla, una imagen corrupta, un dato inesperado
// del back, etc.), sin esto React 19 desmonta TODO el árbol y el usuario
// queda con una pantalla en blanco / negra y la app muerta.
//
// Con esto: se muestra una pantalla amigable con un botón "Reintentar" que
// vuelve a montar el árbol (`key` incremental). No se muestra el stack al
// usuario final; en __DEV__ sí se loguea completo.
//
// Es un componente de clase a propósito: los hooks no pueden capturar
// errores de render de sus hijos (no existe un "useErrorBoundary" nativo).
// No usa ningún contexto (tema, safe area, etc.) para poder envolverlos a
// TODOS y seguir funcionando aunque el que falle sea un Provider.
// ==========================================================================

interface Props {
  children: React.ReactNode;
  /**
   * UI alternativa para boundaries "locales" (ej. envolver un mapa o un
   * chart): si se pasa, se muestra esto en vez de la pantalla completa
   * de "Algo salió mal". Sirve para que el fallo de UN widget no tape
   * toda la pantalla.
   */
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
  /** Cambia en cada "Reintentar" -> fuerza re-montaje del subárbol. */
  resetKey: number;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log útil en desarrollo; en producción queda disponible para
    // cualquier reporter que se agregue más adelante (Sentry, etc.).
    if (__DEV__) {
      console.error("[ErrorBoundary] Error de render capturado:", error);
      console.error(info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({ error: null, resetKey: prev.resetKey + 1 }));
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }
      return (
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>!</Text>
          </View>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>
            Ocurrió un problema al mostrar esta pantalla. Podés reintentar; si
            vuelve a pasar, cerrá y volvé a abrir la app.
          </Text>

          {__DEV__ ? (
            <Text style={styles.devError} numberOfLines={6}>
              {String(this.state.error?.message ?? this.state.error)}
            </Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={this.handleRetry}
            hitSlop={12}
          >
            <Text style={styles.buttonText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#1A120B",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,67,1,0.18)",
    marginBottom: 20,
  },
  iconText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#F94301",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    marginTop: 10,
    maxWidth: 320,
  },
  devError: {
    fontSize: 12,
    color: "#FFB4A1",
    textAlign: "center",
    marginTop: 16,
    maxWidth: 320,
  },
  button: {
    marginTop: 28,
    backgroundColor: "#F94301",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
