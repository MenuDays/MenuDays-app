import { router } from "expo-router";
import UserService from "../../../services/user.service";
import MapLocationPicker from "../../components/map/MapLocationPicker";

interface Props {
  provinceName: string;
  cityName: string;
  latitude?: number;
  longitude?: number;
}

export default function EditProfileLocation({
  provinceName,
  cityName,
  latitude,
  longitude,
}: Props) {
  async function handleConfirm(location: {
    latitude: number;
    longitude: number;
    address: string;
  }) {
    await UserService.updateProfile({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
    });

    router.back();
  }

  return (
    <MapLocationPicker
      title="Editar ubicación"
      subtitle={`${cityName}, ${provinceName}`}
      confirmLabel="Guardar ubicación"
      initialLocation={
        latitude && longitude
          ? {
              latitude,
              longitude,
            }
          : null
      }
      onBack={() => router.back()}
      onConfirm={handleConfirm}
    />
  );
}