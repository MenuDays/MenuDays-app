import React, { useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Easing, StyleSheet } from "react-native";

// ==========================================================================
// Reemplazo de <Modal> de react-native para las "hojas" (bottom sheets) y
// pickers de la app.
//
// POR QUÉ: <Modal> en Android crea una VENTANA nativa aparte (un Dialog).
// Eso trae dos problemas justo en los dispositivos que nos importan:
//
//   1. Modales anidados (ej. el picker de categoría/fecha dentro de la
//      hoja de "nuevo menú"): dos Dialogs apilados -> en varios Android
//      viejos el de arriba deja de recibir toques o congela la UI.
//
//   2. Abrir OTRA Activity (el selector de fotos de expo-image-picker)
//      desde dentro de un Modal: al volver, la ventana del Dialog puede
//      no recuperar el foco y los toques de esa hoja quedan muertos
//      ("no puedo subir la foto y encima se traba la pantalla").
//
// Esta versión monta la hoja como un overlay absoluto DENTRO del mismo
// árbol de React (misma ventana nativa), arriba de todo por zIndex +
// elevation. Sin ventana nativa nueva -> sin los dos problemas de arriba.
// El contenido (backdrop + tarjeta) lo sigue poniendo cada consumidor,
// igual que antes; esto solo aporta el posicionamiento, el fade de
// entrada/salida y el manejo del botón "atrás" de Android.
// ==========================================================================

interface SheetOverlayProps {
  visible: boolean;
  /** Botón "atrás" de Android mientras la hoja está abierta. */
  onRequestClose: () => void;
  children: React.ReactNode;
}

export default function SheetOverlay({
  visible,
  onRequestClose,
  children,
}: SheetOverlayProps) {
  // Se mantiene montado durante la animación de salida.
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  // Ref para el callback -> el listener de "atrás" no se re-suscribe en
  // cada render aunque el padre pase una función nueva.
  const onRequestCloseRef = useRef(onRequestClose);
  onRequestCloseRef.current = onRequestClose;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // `mounted` a propósito fuera de deps: solo reaccionamos a `visible`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onRequestCloseRef.current();
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.host, { opacity: anim }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    // Arriba de bottom navs (elevation 10-12), FABs y headers.
    zIndex: 1000,
    elevation: 1000,
  },
});
