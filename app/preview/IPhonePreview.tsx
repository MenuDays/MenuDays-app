import React from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  children: React.ReactNode;
}

export default function IPhonePreview({ children }: Props) {
  return (
    <View style={styles.page}>
      <View style={styles.phone}>

        <View style={styles.island} />

        <View style={styles.screen}>
          {children}
        </View>

        <View style={styles.homeIndicator} />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#202020",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  phone: {
    width: 420,
    height: 900,

    backgroundColor: "#111",

    borderRadius: 58,

    borderWidth: 10,
    borderColor: "#111",

    overflow: "hidden",

    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 35,
    shadowOffset: {
      width: 0,
      height: 20,
    },

    elevation: 30,
  },

  island: {
    position: "absolute",

    top: 12,

    alignSelf: "center",

    width: 130,
    height: 36,

    backgroundColor: "#000",

    borderRadius: 30,

    zIndex: 20,
  },

  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  homeIndicator: {
    position: "absolute",

    bottom: 10,

    alignSelf: "center",

    width: 140,
    height: 5,

    borderRadius: 5,

    backgroundColor: "#fff",

    opacity: 0.9,
  },
});