import React from "react";
import { StyleSheet, View } from "react-native";

import EditProfileInput from "./EditProfileInput";

interface EditProfileFormProps {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;

  onChangeFirstName: (text: string) => void;
  onChangeLastName: (text: string) => void;
  onChangeEmail: (text: string) => void;
  onChangePhoneNumber: (text: string) => void;
}

export default function EditProfileForm({
  firstName,
  lastName,
  email,
  phoneNumber,
  onChangeFirstName,
  onChangeLastName,
  onChangeEmail,
  onChangePhoneNumber,
}: EditProfileFormProps) {
  return (
    <View style={styles.container}>
      <EditProfileInput
        icon="person-outline"
        label="Nombre"
        value={firstName}
        onChangeText={onChangeFirstName}
        placeholder="Ingresa tu nombre"
      />

      <EditProfileInput
        icon="person-outline"
        label="Apellido"
        value={lastName}
        onChangeText={onChangeLastName}
        placeholder="Ingresa tu apellido"
      />

      <EditProfileInput
        icon="mail-outline"
        label="Correo electrónico"
        value={email}
        onChangeText={onChangeEmail}
        placeholder="ejemplo@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <EditProfileInput
        icon="call-outline"
        label="Teléfono"
        value={phoneNumber}
        onChangeText={onChangePhoneNumber}
        placeholder="+593..."
        keyboardType="phone-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginTop: 12,
  },
});