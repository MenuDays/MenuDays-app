import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthService from "../../services/auth.service";
import CategoryService, { Category } from "../../services/category.service";
import RestaurantService, { Restaurant } from "../../services/restaurant.service";
import { AppAlert } from "../components/common/AppAlert";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import ScreenHeader from "../components/restaurant/ScreenHeader";
import { usePreviewMode } from "../../contexts/PreviewModeContext";

// "Mi perfil" pasó a ser un menú simple (no un formulario gigante todo
// junto): tarjeta con el resumen del restaurante + 3 accesos a sus
// respectivas pantallas de configuración (perfil / categorías /
// delivery), que ya existían por separado. Cada una recarga sus datos
// solita al entrar, así que acá solo hace falta lo mínimo para mostrar
// el resumen y el estado actual de cada sección.

export default function RestaurantProfileScreen() {
  const { enterPreview } = usePreviewMode();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([
        RestaurantService.getProfile(),
        CategoryService.getMyCategories().catch(() => []),
      ])
        .then(([restaurantData, categoriesData]) => {
          if (cancelled) return;
          setRestaurant(restaurantData);
          setCategories(categoriesData);
        })
        .catch((e) => console.log("Error cargando perfil:", e))
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [])
  );

  function handleViewAsComensal() {
    enterPreview("restaurante");
    router.push("/(home)/(tabs)");
  }

  function handleLogout() {
    AppAlert.alert("Cerrar sesión", "¿Seguro que quieres cerrar tu sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await AuthService.logout();
          } catch (e) {
            console.log("Error al cerrar sesión:", e);
          } finally {
            router.replace("/(auth)/login");
          }
        },
      },
    ]);
  }

  if (loading && !restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5A800" />
      </View>
    );
  }

  if (!restaurant) return null;

  const deliverySubtitle = restaurant.ofrece_delivery
    ? `Delivery: ${restaurant.nombre_delivery || "configurado"}`
    : "Solo retiro en el local";

  const categoriesSubtitle =
    categories.length > 0
      ? `${categories.length} categoría${categories.length === 1 ? "" : "s"} seleccionada${categories.length === 1 ? "" : "s"}`
      : "Todavía no elegiste categorías";

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScreenHeader title="Mi perfil" showBack />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          {restaurant.logo_url ? (
            <Image source={{ uri: restaurant.logo_url }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Ionicons name="storefront" size={26} color="#F5A800" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryName} numberOfLines={1}>
              {restaurant.nombre_comercial}
            </Text>
            <Text style={styles.summarySubtitle} numberOfLines={1}>
              {restaurant.ciudad
                ? `${restaurant.ciudad.nombre}, ${restaurant.ciudad.provincia.nombre}`
                : "Sin ciudad configurada"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>CONFIGURACIÓN</Text>

        <View style={styles.menuGroup}>
          <MenuRow
            icon="storefront-outline"
            title="Configurar perfil"
            subtitle="Nombre, portada, ubicación, horarios y contacto"
            onPress={() => router.push("/(restaurant)/editar-perfil")}
          />
          <View style={styles.menuDivider} />
          <MenuRow
            icon="pricetags-outline"
            title="Configurar categorías"
            subtitle={categoriesSubtitle}
            onPress={() => router.push("/(restaurant)/elegir-categorias?from=perfil")}
          />
          <View style={styles.menuDivider} />
          <MenuRow
            icon="bicycle-outline"
            title="Configurar delivery"
            subtitle={deliverySubtitle}
            onPress={() => router.push("/(restaurant)/configurar-delivery?from=perfil")}
          />
        </View>

        <TouchableOpacity style={styles.previewButton} onPress={handleViewAsComensal}>
          <Ionicons name="eye-outline" size={18} color="#F5A800" />
          <Text style={styles.previewButtonText}>Ver como comensal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#E53935" />
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <RestaurantBottomNav />
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={19} color="#F5A800" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuRowTitle}>{title}</Text>
        <Text style={styles.menuRowSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C9C9C9" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    // deja lugar para que la bottom nav flotante no tape lo último
    paddingBottom: 110,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  logoPlaceholder: {
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  summarySubtitle: {
    fontSize: 12.5,
    color: "#8A8A8A",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#9E9E9E",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 28,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  menuRowSubtitle: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F2F2F2",
    marginLeft: 66,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#F5A800",
    marginBottom: 12,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5A800",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F44336",
  },
});
