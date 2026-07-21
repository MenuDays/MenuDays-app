import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface DeviceLocationState {
  street: string | null;
  cityProvince: string | null;
  loading: boolean;
}

type LocationResult = Omit<DeviceLocationState, 'loading'>;

const EMPTY: LocationResult = { street: null, cityProvince: null };

// Cache a nivel de módulo: una vez resuelto, todas las pantallas
// que usen el hook reciben el mismo resultado sin volver a pedir GPS.
let cachedResult: LocationResult | null = null;
// Si ya hay un pedido en curso, los llamados concurrentes esperan
// la MISMA promesa en vez de disparar otro getCurrentPositionAsync
// (esto es lo que evita la carrera entre Home y Perfil).
let inFlightPromise: Promise<LocationResult> | null = null;

async function fetchDeviceLocation(): Promise<LocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('[useDeviceLocation] permiso denegado');
    return EMPTY;
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    console.log('[useDeviceLocation] servicios de ubicación desactivados');
    return EMPTY;
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const [place] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    if (!place) return EMPTY;

    const street =
      place.street && place.streetNumber
        ? `${place.street} ${place.streetNumber}`
        : place.street ?? null;

    const cityProvince = [place.city, place.region].filter(Boolean).join(', ') || null;

    return { street, cityProvince };
  } catch (e) {
    console.log('[useDeviceLocation] ERROR obteniendo ubicación:', e);
    return EMPTY;
  }
}

function getDeviceLocation(): Promise<LocationResult> {
  if (cachedResult) return Promise.resolve(cachedResult);
  if (!inFlightPromise) {
    inFlightPromise = fetchDeviceLocation().then((result) => {
      cachedResult = result;
      inFlightPromise = null;
      return result;
    });
  }
  return inFlightPromise;
}

export function useDeviceLocation(): DeviceLocationState {
  const [result, setResult] = useState<LocationResult>(cachedResult ?? EMPTY);
  const [loading, setLoading] = useState(!cachedResult);

  useEffect(() => {
    let mounted = true;
    if (cachedResult) {
      setResult(cachedResult);
      setLoading(false);
      return;
    }
    getDeviceLocation().then((r) => {
      if (mounted) {
        setResult(r);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { ...result, loading };
}