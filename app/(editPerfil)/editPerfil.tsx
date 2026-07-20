import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import UserService, { User } from "../../services/user.service";

import EditProfileActions from "./componentes/EditProfileActions";
import EditProfileAvatar from "./componentes/EditProfileAvatar";
import EditProfileForm from "./componentes/EditProfileForm";
import EditProfileHeader from "./componentes/EditProfileHeader";
import EditProfileLocation from "./componentes/EditProfileLocation";

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<User | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
const [email, setEmail] = useState("");
  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const data = await UserService.getMe();

      setUser(data);

      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhoneNumber(data.phoneNumber ?? "");
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Error",
        "No se pudo cargar el perfil."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(
        "Campos incompletos",
        "Completa nombre y apellido."
      );
      return;
    }

    try {
      setSaving(true);

      const updated = await UserService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      await UserService.saveLocal(updated);

      Alert.alert(
        "Perfil actualizado",
        "Tus cambios fueron guardados correctamente.",
        [
          {
            text: "Aceptar",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        "No se pudo actualizar el perfil."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#F5A800"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <EditProfileHeader />

        <EditProfileAvatar
  profilePhotoUrl={user.profilePhotoUrl}
  firstName={firstName}
  lastName={lastName}
  onPressCamera={() => {}}
/>

        <EditProfileForm
  firstName={firstName}
  lastName={lastName}
  email={email}
  phoneNumber={phoneNumber}
  onChangeFirstName={setFirstName}
  onChangeLastName={setLastName}
  onChangeEmail={setEmail}
  onChangePhoneNumber={setPhoneNumber}
/>

        <EditProfileLocation
          provinceName={user.province?.name ?? ""}
          cityName={user.city?.name ?? ""}
          latitude={user.latitude}
          longitude={user.longitude}
        />

        <EditProfileActions
          loading={saving}
          onCancel={() => router.back()}
          onSave={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
});