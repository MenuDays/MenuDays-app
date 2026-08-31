import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import OrderService, {
  OrderDetail,
  isTerminalOrderStatus,
} from "../services/order.service";

// ==========================================================================
// Sincronización del estado del pedido para el COMENSAL, sin WebSockets.
//
// POR QUÉ POLLING Y NO WEBSOCKET:
// El backend (NestJS + Prisma) NO tiene infraestructura de tiempo real
// (no hay @nestjs/websockets, socket.io ni event-emitter en sus
// dependencias). El endpoint GET /orders/:id ya devuelve SIEMPRE el estado
// real y actual desde PostgreSQL. Agregar un gateway de sockets + auth de
// socket + reconexión sería una tecnología pesada nueva de los dos lados.
// Polling contra el endpoint que ya existe es lo más estable y compatible
// (funciona igual en Android viejo, con red intermitente, etc.).
//
// QUÉ HACE ESTE HOOK (todo lo que pide la spec):
//  - refresca al ENFOCAR la pantalla (al volver, se ve lo último al toque);
//  - hace polling cada POLL_INTERVAL_MS SOLO mientras la pantalla está
//    enfocada Y la app en primer plano;
//  - detiene el polling cuando el pedido llega a un estado FINAL
//    (entregado / rechazado / cancelado);
//  - pausa en background y reanuda (con un fetch inmediato) al volver;
//  - nunca dispara dos requests a la vez (guard `inFlight`);
//  - limpia intervalos y listeners al desmontar / desenfocar (sin leaks);
//  - un error temporal de red NO rompe la pantalla: se conserva el último
//    estado conocido y se reintenta en el próximo tick.
// ==========================================================================

const POLL_INTERVAL_MS = 12000;

export interface UseOrderDetailResult {
  order: OrderDetail | null;
  /** Solo la PRIMERA carga (cuando todavía no hay ningún dato). */
  loading: boolean;
  /** Último error. Si hay `order`, es un aviso suave, no un bloqueo. */
  error: string | null;
  /** Pull-to-refresh manual. */
  refetch: () => void;
  refreshing: boolean;
  /** true mientras el hook sigue haciendo polling (pedido no terminal). */
  isLive: boolean;
}

export function useOrderDetail(id: string | undefined): UseOrderDetailResult {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Refs -> no re-crean el efecto de polling en cada render.
  const inFlight = useRef(false);
  const orderRef = useRef<OrderDetail | null>(null);
  const idRef = useRef(id);
  const mountedRef = useRef(true);
  orderRef.current = order;
  idRef.current = id;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchOnce = useCallback(async (opts?: { manual?: boolean }) => {
    const currentId = idRef.current;
    if (!currentId || inFlight.current) return;
    inFlight.current = true;
    if (opts?.manual) setRefreshing(true);
    try {
      const data = await OrderService.getById(currentId);
      // Evita pisar el estado si mientras tanto se cambió de pedido o se
      // desmontó la pantalla.
      if (!mountedRef.current || idRef.current !== currentId) return;
      setOrder(data);
      setError(null);
    } catch (e: any) {
      if (!mountedRef.current || idRef.current !== currentId) return;
      // No romper la pantalla: si ya hay datos, se mantienen.
      setError(e?.message || "No se pudo actualizar el pedido.");
    } finally {
      inFlight.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Reset + fetch al cambiar de pedido (por si el `id` cambia sin
  // remontar la pantalla).
  useEffect(() => {
    setOrder(null);
    setLoading(true);
    setError(null);
    orderRef.current = null;
    void fetchOnce();
  }, [id, fetchOnce]);

  useFocusEffect(
    useCallback(() => {
      let interval: ReturnType<typeof setInterval> | null = null;

      const stop = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };

      const tick = () => {
        // Estado final -> no seguir consultando.
        if (isTerminalOrderStatus(orderRef.current?.pedido.estado)) {
          stop();
          return;
        }
        if (AppState.currentState === "active") {
          void fetchOnce();
        }
      };

      const start = () => {
        if (interval) return;
        if (isTerminalOrderStatus(orderRef.current?.pedido.estado)) return;
        interval = setInterval(tick, POLL_INTERVAL_MS);
      };

      // Fetch inmediato al enfocar + arranca el polling.
      void fetchOnce();
      start();

      const appStateSub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          void fetchOnce();
          start();
        } else {
          stop();
        }
      });

      return () => {
        stop();
        appStateSub.remove();
      };
    }, [fetchOnce])
  );

  return {
    order,
    loading,
    error,
    refetch: () => fetchOnce({ manual: true }),
    refreshing,
    isLive: !isTerminalOrderStatus(order?.pedido.estado),
  };
}
