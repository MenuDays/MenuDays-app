  import { useEffect, useState } from 'react';
  import * as Location from 'expo-location';

  export interface DeviceLocationState {
    street: string | null;
    cityProvince: string | null;
    loading: boolean;
  }

  type LocationResult = Omit<DeviceLocationState, 'loading'>;

  const EMPTY: LocationResult = { street: null, cityProvince: null };

  // Cache por coordenadas: si ya resolvimos la dirección para este par
  // lat/lng, no volvemos a pegarle a reverseGeocodeAsync.
  const cache = new Map<string, LocationResult>();
  const inFlight = new Map<string, Promise<LocationResult>>();

  function cacheKey(latitude: number, longitude: number) {
    return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  }

  async function fetchAddressForCoords(
    latitude: number,
    longitude: number
  ): Promise<LocationResult> {
    try {
      const [place] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (!place) return EMPTY;

      const street =
        place.street && place.streetNumber
          ? `${place.street} ${place.streetNumber}`
          : place.street ?? null;

      const cityProvince =
        [place.city, place.region].filter(Boolean).join(', ') || null;

      return { street, cityProvince };
    } catch (e) {
      console.log('[useDeviceLocation] ERROR en reverse geocode:', e);
      return EMPTY;
    }
  }

  function getAddressForCoords(
    latitude: number,
    longitude: number
  ): Promise<LocationResult> {
    const key = cacheKey(latitude, longitude);

    if (cache.has(key)) {
      return Promise.resolve(cache.get(key)!);
    }

    if (!inFlight.has(key)) {
      const promise = fetchAddressForCoords(latitude, longitude).then((result) => {
        cache.set(key, result);
        inFlight.delete(key);
        return result;
      });
      inFlight.set(key, promise);
    }

    return inFlight.get(key)!;
  }

  /**
   * Reverse-geocodea la ubicación GUARDADA del usuario (la que se fijó
   * en el mapa al registrarse / al cambiar ubicación desde Perfil).
   *
   * NO usa el GPS en vivo del dispositivo — ese caso ya lo maneja
   * MapLocationPicker por separado, con el botón "mi ubicación".
   *
   * Pasar undefined/null en latitude o longitude significa "todavía
   * no hay ubicación guardada" (perfil sin cargar, o usuario que nunca
   * pasó por el flujo de mapa).
   */
  export function useDeviceLocation(
    latitude?: number | null,
    longitude?: number | null
  ): DeviceLocationState {
    const hasCoords = latitude != null && longitude != null;
    const initialKey = hasCoords ? cacheKey(latitude, longitude) : null;

    const [result, setResult] = useState<LocationResult>(
      initialKey && cache.has(initialKey) ? cache.get(initialKey)! : EMPTY
    );
    const [loading, setLoading] = useState(hasCoords && !cache.has(initialKey!));

    useEffect(() => {
      let mounted = true;

      if (!hasCoords) {
        setResult(EMPTY);
        setLoading(false);
        return;
      }

      const key = cacheKey(latitude, longitude);
      if (cache.has(key)) {
        setResult(cache.get(key)!);
        setLoading(false);
        return;
      }

      setLoading(true);
      getAddressForCoords(latitude, longitude).then((r) => {
        if (mounted) {
          setResult(r);
          setLoading(false);
        }
      });

      return () => {
        mounted = false;
      };
    }, [latitude, longitude]);

    return { ...result, loading };
  }