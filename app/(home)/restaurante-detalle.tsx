import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Ver comentario en MapLocationPicker.tsx: SafeMapView vive fuera de
// app/ a propósito, para que el escaneo de rutas de Expo Router no
// intente bundlear su variante nativa (react-native-maps real) en web.
import MapView, { Marker, PROVIDER_GOOGLE } from "../../components/map/SafeMapView";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import KeyboardAvoidingScreen from "../components/common/KeyboardAvoidingScreen";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { optimizedImageUri } from "../../utils/imageUrl";
import { SafeAreaView } from "react-native-safe-area-context";
// TODO: si el proyecto todavía no tiene "expo-clipboard" instalado,
// correr `npx expo install expo-clipboard` (se usa para "Copiar dirección").
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";

import FavoriteService from "../../services/favorite.service";
import LocationService from "../../services/location.service";
import RestaurantService, { RestaurantPublicDetail } from "../../services/restaurant.service";
import ReviewService, { Review } from "../../services/review.service";
import ReportService, { ReportReason } from "../../services/report.service";
import OrderService from "../../services/order.service";
import { AppAlert } from "../components/common/AppAlert";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

const DAY_NAMES = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface Props {
  previewRestaurantId?: string;
  ownerPreview?: boolean;
}

export default function RestauranteDetalleScreen({
  previewRestaurantId,
  ownerPreview = false,
}: Props) {
const { colors } = useTheme();
const styles = useMemo(() => createStyles(colors), [colors]);
const { id: routeId } = useLocalSearchParams<{ id: string }>();

const restaurantId = previewRestaurantId ?? routeId;

  const [restaurant, setRestaurant] = useState<RestaurantPublicDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  // Sin esto, un toque en "Ver Menú" mientras la navegación todavía está
  // resolviendo (que puede tardar si el back está "frío") no daba
  // feedback visual, así que el usuario volvía a tocar 2-3 veces --
  // cada toque empujaba OTRA instancia de restaurante-catalogo a la
  // pila, y por eso hacía falta ir "para atrás" varias veces para que
  // se sintiera normal otra vez.
  const [openingMenu, setOpeningMenu] = useState(false);
  // Distancia calculada en el cliente a partir de la última ubicación
  // guardada del usuario (LocationService) + lat/lng del restaurante.
  // No hay endpoint que la devuelva calculada desde el back.
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReasons, setReportReasons] = useState<ReportReason[]>([]);
  const [reportReasonsLoading, setReportReasonsLoading] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // Reseña "en línea" desde el propio perfil del restaurante: solo se
  // puede calificar si el comensal tiene al menos un pedido ENTREGADO de
  // este restaurante sin reseña todavía (el back exige pedidoId al crear
  // la reseña -- ver review.service.ts). Se busca en el historial de
  // pedidos del usuario; si el POST falla porque ese pedido puntual ya
  // tenía reseña, se propaga el error del back tal cual.
  const [reviewableOrderId, setReviewableOrderId] = useState<string | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  function loadAll() {
    if (!restaurantId) return;
    Promise.all([
      RestaurantService.getPublicDetail(restaurantId),
      ReviewService.getRestaurantReviews(restaurantId),
      // GET /favorites ya existe y trae el listado completo del usuario;
      // no hay un endpoint "¿es favorito?" puntual, así que se deriva acá.
      FavoriteService.getAll().catch(() => []),
      LocationService.getUserLocation().catch(() => null),
      // En ownerPreview no tiene sentido (el dueño no es comensal acá).
      ownerPreview ? Promise.resolve([]) : OrderService.getHistory().catch(() => []),
      AsyncStorage.getItem("@MenuDays:user").catch(() => null),
    ])
      .then(([restaurantData, reviewsData, favoritesData, userLocation, orderHistory, userRaw]) => {
        setRestaurant(restaurantData);
        setReviews(reviewsData);
        setIsFavorite(favoritesData.some((f) => f.restaurant.id === restaurantData.id));

        const { lat, lng } = restaurantData.ubicacion;
        if (userLocation && lat != null && lng != null) {
          setDistanceKm(
            haversineKm(userLocation.latitude, userLocation.longitude, lat, lng)
          );
        }

        // Solo se puede calificar si hay un pedido ENTREGADO de este
        // restaurante que este usuario todavía no reseñó.
        try {
          const currentUserId = userRaw ? JSON.parse(userRaw)?.id : null;
          const reviewedPedidoIds = new Set(
            reviewsData
              .filter((r) => currentUserId != null && String(r.usuario_id) === String(currentUserId))
              .map((r) => String(r.pedido_id))
          );
          const eligible = orderHistory.find(
            (o) =>
              String(o.restaurante.id) === String(restaurantData.id) &&
              o.estado === "entregado" &&
              !reviewedPedidoIds.has(String(o.id))
          );
          setReviewableOrderId(eligible ? String(eligible.id) : null);
        } catch {
          // Sin datos de usuario/pedidos: simplemente no se ofrece calificar.
        }
      })
      .catch((e: any) => {
        const msg = e.message || "No se pudo cargar el restaurante.";
        setError(msg);
        AppAlert.alert("Error", msg);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setRestaurant(null);
    setReviews([]);
    setIsFavorite(false);
    setDistanceKm(null);
    setReviewableOrderId(null);
    setMyRating(0);
    setMyComment("");
    loadAll();
  }, [restaurantId, ownerPreview]);

  function handleRefresh() {
    setRefreshing(true);
    loadAll();
  }

  async function handleSubmitInlineReview() {
    if (!reviewableOrderId || myRating === 0 || submittingReview) return;
    setSubmittingReview(true);
    try {
      await ReviewService.create({
        pedidoId: reviewableOrderId,
        calificacion: myRating,
        comentario: myComment,
      });
      // Refresca reseñas + promedio/cantidad del restaurante con los
      // datos reales que acaba de confirmar el back, en vez de simularlo
      // a mano acá.
      const [freshDetail, freshReviews] = await Promise.all([
        RestaurantService.getPublicDetail(restaurantId),
        ReviewService.getRestaurantReviews(restaurantId),
      ]);
      setRestaurant(freshDetail);
      setReviews(freshReviews);
      setReviewableOrderId(null);
      setMyRating(0);
      setMyComment("");
      AppAlert.alert("¡Gracias!", "Tu reseña fue publicada.");
    } catch (e: any) {
      AppAlert.alert("No se pudo enviar", e.message || "Intentá de nuevo en unos minutos.");
    } finally {
      setSubmittingReview(false);
    }
  }

  const scheduleGroups = useMemo(
    () => (restaurant ? groupSchedule(restaurant.horarios) : []),
    [restaurant]
  );

  const ratingDistribution = useMemo(() => buildDistribution(reviews), [reviews]);

  async function handleToggleFavorite() {
    if (!restaurant) return;
    const previous = isFavorite;
    setIsFavorite(!previous); // optimista
    setFavoriteLoading(true);
    try {
      if (previous) {
        await FavoriteService.remove(restaurant.id);
      } else {
        await FavoriteService.add(restaurant.id);
      }
    } catch (e: any) {
      setIsFavorite(previous); // revertir si el back rechazó la operación
      AppAlert.alert("Error", e.message || "No se pudo actualizar favoritos.");
    } finally {
      setFavoriteLoading(false);
    }
  }

  function handleGoogleMaps() {
    if (!restaurant) return;
    const { lat, lng } = restaurant.ubicacion;
    const url =
      lat != null && lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.direccion ?? restaurant.nombreComercial)}`;
    Linking.openURL(url);
  }

  function handleLlamar() {
    const phone = restaurant?.telefonos[0]?.telefono;
    if (!phone) {
      AppAlert.alert("Sin teléfono", "Este restaurante todavía no cargó un teléfono de contacto.");
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\D/g, "")}`);
  }

  function handleSocialLink(platform: "instagram" | "facebook" | "tiktok", label: string) {
    const link = restaurant?.redesSociales.find((r) => r.plataforma === platform);
    if (!link) {
      AppAlert.alert(`Sin ${label}`, `Este restaurante todavía no cargó su ${label}.`);
      return;
    }
    Linking.openURL(link.url).catch(() => {
      AppAlert.alert("Link inválido", `El ${label} de este restaurante no es un link válido.`);
    });
  }

  function handleCompartir() {
    if (!restaurant) return;
    Share.share({
      message: `Mira ${restaurant.nombreComercial} en MenuDays${restaurant.direccion ? ` — ${restaurant.direccion}` : ""}`,
    });
  }

  function handleOpenReport() {
    setReportModalVisible(true);
    if (reportReasons.length === 0) {
      setReportReasonsLoading(true);
      ReportService.getReasons()
        .then(setReportReasons)
        .catch(() => AppAlert.alert("Error", "No se pudieron cargar los motivos de reporte."))
        .finally(() => setReportReasonsLoading(false));
    }
  }

  function handleCloseReport() {
    if (submittingReport) return;
    setReportModalVisible(false);
    setSelectedReasonId(null);
    setReportDescription("");
  }

  async function handleSubmitReport() {
    if (!restaurant || !selectedReasonId || submittingReport) return;
    setSubmittingReport(true);
    try {
      await ReportService.create(restaurant.id, selectedReasonId, reportDescription);
      setReportModalVisible(false);
      setSelectedReasonId(null);
      setReportDescription("");
      AppAlert.alert("Reporte enviado", "Gracias. Nuestro equipo revisará el caso.");
    } catch (e: any) {
      AppAlert.alert("No se pudo enviar el reporte", e.message || "Ocurrió un error. Intentá de nuevo.");
    } finally {
      setSubmittingReport(false);
    }
  }

  function handleCopiarDireccion() {
    if (!restaurant?.direccion) return;
    Clipboard.setStringAsync(restaurant.direccion);
    AppAlert.alert("Listo", "Dirección copiada.");
  }

  function handleComoLlegar() {
    if (!restaurant) return;
    const { lat, lng } = restaurant.ubicacion;
    const url =
      lat != null && lng != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.direccion ?? restaurant.nombreComercial)}`;
    Linking.openURL(url);
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="cloud-offline-outline" size={36} color={colors.placeholder} />
        <Text style={{ marginTop: 10, textAlign: "center", color: colors.textSecondary, fontSize: 13, lineHeight: 19, paddingHorizontal: 30 }}>
          {error || "No se pudo cargar el restaurante."}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 14, backgroundColor: "#FB8C00", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_700Bold" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { lat, lng } = restaurant.ubicacion;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingScreen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
      >
        <View style={styles.coverWrap}>
          {restaurant.portadaUrl ? (
            <Image source={{ uri: optimizedImageUri(restaurant.portadaUrl, "cover") }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Ionicons name="image-outline" size={32} color="#C9C9C9" />
            </View>
          )}

          {/* Fade inferior: la portada se funde con el fondo de la pantalla
              en vez de cortar con una línea dura. */}
          <LinearGradient
            colors={["transparent", colors.surface]}
            style={styles.coverFade}
            pointerEvents="none"
          />

          <SafeAreaView style={styles.coverOverlay} edges={["top"]}>
            {/* En ownerPreview (pestaña "Vista previa" de mi-local.tsx) esta
                pantalla vive embebida DENTRO de otra, no como ruta propia
                -- un router.back() acá pisaba el historial real de
                navegación y terminaba mandando a cualquier lado (incluso
                al lado comensal si se había usado "Ver como comensal"
                antes). mi-local.tsx ya tiene su propio header con back,
                así que acá directamente no mostramos el botón. */}
            {ownerPreview ? (
              <View style={styles.roundButton} />
            ) : (
              <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={20} color="#3E2723" />
              </TouchableOpacity>
            )}

            <View style={styles.coverOverlayRight}>
              <TouchableOpacity style={styles.roundButton} onPress={handleOpenReport}>
                <Ionicons name="flag-outline" size={18} color="#3E2723" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.roundButton}
                onPress={handleToggleFavorite}
                disabled={favoriteLoading}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={isFavorite ? "#E53935" : "#3E2723"}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            {restaurant.logoUrl ? (
              <Image source={{ uri: optimizedImageUri(restaurant.logoUrl, "thumb") }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Ionicons name="restaurant-outline" size={20} color={colors.placeholder} />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={2}>{restaurant.nombreComercial}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaRatingChip}>
                  <Ionicons name="star" size={13} color="#F5A800" />
                  <Text style={styles.metaText}>{restaurant.calificacionPromedio.toFixed(1)}</Text>
                </View>
                {restaurant.categorias.length > 0 && (
                  <Text style={styles.metaTextSecondary} numberOfLines={2}>
                    · {restaurant.categorias.map((c) => c.categoria.nombre).join(", ")}
                  </Text>
                )}
                {distanceKm != null && (
                  <Text style={styles.metaTextSecondary}> · {formatDistance(distanceKm)}</Text>
                )}
              </View>
            </View>
          </View>

          <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.actionsRow}
  style={{ marginHorizontal: -20 }}
>
            <ActionButton icon="navigate-outline" label="Google Maps" onPress={handleGoogleMaps} />
            <ActionButton icon="call-outline" label="Llamar" onPress={handleLlamar} />
            <ActionButton
              icon="logo-instagram"
              label="Instagram"
              onPress={() => handleSocialLink("instagram", "Instagram")}
            />
            <ActionButton
              icon="logo-tiktok"
              label="TikTok"
              onPress={() => handleSocialLink("tiktok", "TikTok")}
            />
            <ActionButton
              icon="logo-facebook"
              label="Facebook"
              onPress={() => handleSocialLink("facebook", "Facebook")}
            />
            <ActionButton icon="share-social-outline" label="Compartir" onPress={handleCompartir} />
          </ScrollView>

          {restaurant.descripcion ? (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="information-circle" size={18} color="#FB8C00" />
                <Text style={styles.sectionTitle}>Sobre nosotros</Text>
              </View>
              <Text style={styles.paragraph}>{restaurant.descripcion}</Text>
            </View>
          ) : null}

          {(restaurant.menus.length > 0 || restaurant.platos.length > 0 || restaurant.promociones.length > 0) && (
            <TouchableOpacity
              style={styles.verMenuButton}
              activeOpacity={0.9}
              disabled={openingMenu}
              onPress={() => {
                if (openingMenu) return;
                setOpeningMenu(true);
                router.push({
                  pathname: "/(home)/restaurante-catalogo",
                  params: {
                    id: String(restaurant.id),
                    nombre: restaurant.nombreComercial,
                    ofreceDelivery: String(restaurant.ofreceDelivery),
                    nombreDelivery: restaurant.nombreDelivery ?? "",
                    ownerPreview: String(!!ownerPreview),
                  },
                });
                // Se reactiva solo si el usuario vuelve a esta pantalla
                // sin de verdad haber entrado (ej. la navegación tardó y
                // canceló) -- si entró bien, esta pantalla puede quedar
                // debajo en la pila sin que importe su estado.
                setTimeout(() => setOpeningMenu(false), 1200);
              }}
            >
              <LinearGradient
                colors={["#FFB74D", "#FB8C00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verMenuGradient}
              >
                {openingMenu ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="restaurant" size={18} color="#FFFFFF" />
                    <Text style={styles.verMenuText}>Ver Menú</Text>
                    <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación y Contacto</Text>

            {lat != null && lng != null && (
              <View style={styles.mapWrap}>
                {/* Si el mapa nativo falla al inicializar (Play Services
                    viejo/ausente en algún Android), NO se cae la pantalla:
                    se muestra un recuadro neutro y la dirección de texto de
                    abajo sigue estando. */}
                <ErrorBoundary
                  fallback={
                    <View style={[styles.mapWrap, styles.mapFallback]}>
                      <Ionicons name="map-outline" size={22} color={colors.textSecondary} />
                      <Text style={styles.mapFallbackText}>Mapa no disponible</Text>
                    </View>
                  }
                >
                  <MapView
                    style={{ flex: 1 }}
                    provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    region={{
                      latitude: lat,
                      longitude: lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <Marker coordinate={{ latitude: lat, longitude: lng }} />
                  </MapView>
                </ErrorBoundary>
              </View>
            )}

            {restaurant.direccion ? (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.addressText}>
                  {restaurant.direccion}
                  {restaurant.ciudad ? `, ${restaurant.ciudad.nombre}, ${restaurant.ciudad.provincia.nombre}` : ""}
                </Text>
              </View>
            ) : null}

            <View style={styles.addressButtonsRow}>
              <TouchableOpacity style={styles.outlineButton} onPress={handleCopiarDireccion}>
                <Ionicons name="copy-outline" size={15} color={colors.text} />
                <Text style={styles.outlineButtonText}>Copiar dirección</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filledButton} onPress={handleComoLlegar}>
                <Ionicons name="navigate" size={15} color="#FFFFFF" />
                <Text style={styles.filledButtonText}>Cómo llegar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {scheduleGroups.length > 0 && (
            <View style={styles.scheduleCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="time-outline" size={18} color="#FB8C00" />
                <Text style={styles.sectionTitle}>Horarios de atención</Text>
              </View>
              {scheduleGroups.map((group, i) => (
                <View key={i} style={styles.scheduleRow}>
                  <Text style={styles.scheduleDay}>{group.label}</Text>
                  {group.cerrado ? (
                    <Text style={styles.scheduleClosed}>Cerrado</Text>
                  ) : (
                    <Text style={styles.scheduleHours}>
                      {group.horaApertura} - {group.horaCierre}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {restaurant.galeria.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Galería de Fotos</Text>
                {/* TODO: navegar a una pantalla de galería completa (grid)
                    cuando exista; por ahora solo se ve el scroll horizontal. */}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(home)/restaurant-gallery",
                      params: {
                        id: String(restaurant.id),
                        nombre: restaurant.nombreComercial,
                      },
                    })
                  }
                >
                  <Text style={styles.linkText}>Ver todas</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {restaurant.galeria.map((img) => (
                  <Image key={img.id} source={{ uri: optimizedImageUri(img.url, "thumb") }} style={styles.galleryThumb} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reseñas de la comunidad</Text>

            {reviewableOrderId && (
              <View style={styles.rateCard}>
                <Text style={styles.rateCardTitle}>Calificá tu experiencia</Text>
                <View style={styles.rateStarsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setMyRating(n)} hitSlop={8}>
                      <Ionicons
                        name={n <= myRating ? "star" : "star-outline"}
                        size={34}
                        color={n <= myRating ? "#F5A800" : colors.border}
                        style={{ marginHorizontal: 3 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.rateCommentInput}
                  placeholder="Cuéntanos cómo fue tu experiencia (opcional)"
                  placeholderTextColor={colors.placeholder}
                  value={myComment}
                  onChangeText={setMyComment}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity
                  style={[styles.rateSubmitButton, (myRating === 0 || submittingReview) && { opacity: 0.6 }]}
                  onPress={handleSubmitInlineReview}
                  disabled={myRating === 0 || submittingReview}
                >
                  {submittingReview ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.rateSubmitButtonText}>Publicar reseña</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.reviewsSummaryRow}>
              <View style={styles.reviewsAvgWrap}>
                <Text style={styles.reviewsAvgNumber}>{restaurant.calificacionPromedio.toFixed(1)}</Text>
                <Text style={styles.reviewsAvgLabel}>PROMEDIO</Text>
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <View key={star} style={styles.distributionRow}>
                    <Text style={styles.distributionStar}>{star}</Text>
                    <View style={styles.distributionTrack}>
                      <View
                        style={[
                          styles.distributionFill,
                          { width: `${ratingDistribution[star] ?? 0}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {reviews.slice(0, 2).map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeaderRow}>
                  {review.usuarios.foto_perfil_url ? (
                    <Image source={{ uri: review.usuarios.foto_perfil_url }} style={styles.reviewAvatar} />
                  ) : (
                    <View style={[styles.reviewAvatar, styles.reviewAvatarPlaceholder]}>
                      <Ionicons name="person" size={14} color={colors.placeholder} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>
                      {review.usuarios.nombre} {review.usuarios.apellido}
                    </Text>
                    <Text style={styles.reviewDate}>{relativeTime(review.created_at)}</Text>
                  </View>
                  <View style={styles.reviewStarsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={12}
                        color={i < review.calificacion ? "#F5A800" : colors.border}
                      />
                    ))}
                  </View>
                </View>
                {review.comentario ? <Text style={styles.reviewComment}>"{review.comentario}"</Text> : null}
              </View>
            ))}

            <TouchableOpacity
              style={styles.reviewsButton}
              onPress={() =>
                router.push({
                  pathname: "/restaurant-reviews",
                  params: { id: restaurantId },
                })
              }
            >
              <Ionicons name="chatbubble-outline" size={15} color="#FB8C00" />
              <Text style={styles.reviewsButtonText}>Ver las {restaurant.cantidadResenas} reseñas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingScreen>

      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseReport}
      >
        <View style={styles.modalOverlay}>
          {/* KeyboardAvoidingView acá adentro: el Modal es su propia
              jerarquía nativa y no hereda el manejo de teclado de la
              pantalla de atrás -- sin esto, el textarea de "Descripción
              adicional" (más abajo del todo en este bottom-sheet) quedaba
              tapado por el teclado al enfocarlo. */}
          <KeyboardAvoidingView style={styles.modalContent} behavior="padding">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reportar restaurante</Text>
              <TouchableOpacity onPress={handleCloseReport} disabled={submittingReport} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubtitle}>
                Cuéntanos qué ocurrió para que podamos revisarlo.
              </Text>

              {reportReasonsLoading ? (
                <ActivityIndicator size="small" color="#FB8C00" style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.reasonsList}>
                  {reportReasons.map((reason) => {
                    const selected = selectedReasonId === reason.id;
                    return (
                      <TouchableOpacity
                        key={reason.id}
                        style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                        onPress={() => setSelectedReasonId(reason.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                          {selected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.reasonText}>{reason.nombre}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.modalFieldLabel}>Descripción adicional (opcional)</Text>
              <TextInput
                style={styles.modalTextarea}
                placeholder="Cuéntanos más detalles..."
                placeholderTextColor={colors.placeholder}
                value={reportDescription}
                onChangeText={setReportDescription}
                multiline
                maxLength={1000}
              />
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCloseReport}
                disabled={submittingReport}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  (!selectedReasonId || submittingReport) && styles.modalSubmitButtonDisabled,
                ]}
                onPress={handleSubmitReport}
                disabled={!selectedReasonId || submittingReport}
              >
                {submittingReport ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Enviar reporte</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={18} color="#FB8C00" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ==========================================================================
// Helpers
// ==========================================================================

interface ScheduleGroup {
  label: string;
  cerrado: boolean;
  horaApertura: string;
  horaCierre: string;
}

// Distancia en línea recta entre el usuario y el restaurante, calculada
// en el cliente (fórmula de Haversine) a partir de la última ubicación
// guardada (LocationService.getUserLocation()) y ubicacion.lat/lng que
// ya viene en RestaurantPublicDetail. El back no expone esto calculado.
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// El back ya manda hora_apertura/hora_cierre como string "HH:MM" (24hs),
// ver formatHour() en core/common/utils/format-hour.util.ts del backend
// -- NO son fechas ISO completas, por eso acá se parsea directo en vez
// de hacer new Date(iso) (eso daba NaN:NaN, "12:NaN AM").
function formatHour(hhmm: string | null): string {
  if (!hhmm) return "--:--";
  const [hoursStr, minutesStr] = hhmm.split(":");
  const hours24 = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours24) || Number.isNaN(minutes)) return "--:--";
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}

// Agrupa días consecutivos con el mismo horario (ej: Lunes-Viernes) para
// que se vea como en el mockup, en vez de una fila por cada uno de los 7
// días.
function groupSchedule(
  horarios: RestaurantPublicDetail["horarios"]
): ScheduleGroup[] {
  const byDay = new Map<number, RestaurantPublicDetail["horarios"][number]>();
  // Domingo puede venir como 0 (convención JS) o 7 (convención de la app):
  // se canoniza a 7 para que también aparezca en el resumen del comensal.
  horarios.forEach((h) => byDay.set(h.dia_semana === 0 ? 7 : h.dia_semana, h));

  const groups: ScheduleGroup[] = [];
  let i = 1;
  while (i <= 7) {
    const current = byDay.get(i);
    if (!current) {
      i++;
      continue;
    }
    let j = i;
    while (
      j + 1 <= 7 &&
      byDay.get(j + 1) &&
      byDay.get(j + 1)!.cerrado === current.cerrado &&
      byDay.get(j + 1)!.hora_apertura === current.hora_apertura &&
      byDay.get(j + 1)!.hora_cierre === current.hora_cierre
    ) {
      j++;
    }

    groups.push({
      label: j > i ? `${DAY_NAMES[i]} - ${DAY_NAMES[j]}` : DAY_NAMES[i],
      cerrado: current.cerrado,
      horaApertura: formatHour(current.hora_apertura),
      horaCierre: formatHour(current.hora_cierre),
    });

    i = j + 1;
  }

  return groups;
}

// Distribución de estrellas calculada en el cliente a partir de las
// reseñas ya cargadas. TODO(back): si el listado de reseñas llega a
// paginarse, esto va a quedar incompleto -- lo ideal sería que el back
// devuelva el conteo por estrella junto con calificacionPromedio.
function buildDistribution(reviews: Review[]): Record<number, number> {
  if (reviews.length === 0) return {};
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    counts[r.calificacion] = (counts[r.calificacion] ?? 0) + 1;
  });
  const result: Record<number, number> = {};
  for (const star of [1, 2, 3, 4, 5]) {
    result[star] = (counts[star] / reviews.length) * 100;
  }
  return result;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Hoy";
  if (days === 1) return "Hace 1 día";
  if (days < 7) return `Hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months > 1 ? "es" : ""}`;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenSolid },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.screenSolid },

  coverWrap: { height: 220, backgroundColor: colors.surfaceSecondary },
  cover: { width: "100%", height: "100%" },
  coverFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 80 },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  coverOverlayRight: {
    flexDirection: "row",
    gap: 10,
  },
  // Botones flotantes SOBRE la foto de portada -- se quedan blancos fijos
  // en los dos temas a propósito (identidad visual sobre una foto, no
  // sobre el fondo de la app), igual criterio que el pill de ubicación
  // del header de Home.
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  content: { padding: 20 },
  // El logo se superpone al borde inferior de la portada (marginTop
  // negativo), pero el nombre va alineado abajo ("flex-end") en vez de
  // centrado con el logo -- así el texto queda debajo del solape, sin
  // mezclarse visualmente con la foto de portada.
  // El solape con la portada va SOLO en el logo (marginTop negativo acá
  // abajo), no en toda la fila -- antes ese margen negativo estaba en
  // headerRow, así que el nombre se movía junto con el logo hacia arriba.
  // En pantallas anchas (tablet), donde la portada de 220px de alto ocupa
  // proporcionalmente mucho menos ancho visual, ese desplazamiento hacía
  // que el nombre terminara pisando la imagen en vez de quedar debajo.
  // Con el margen solo en el logo, el nombre siempre arranca justo al
  // principio del área de contenido, sin importar el ancho de pantalla.
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    marginTop: -36,
  },
  logoPlaceholder: { alignItems: "center", justifyContent: "center" },
  name: { fontSize: 19, fontWeight: "900", color: colors.text },
  // flexWrap: antes esta fila (estrella + calificación + categorías +
  // distancia) era todo texto suelto en una sola línea sin wrap -- con
  // varias categorías largas o pantallas angostas, el texto se cortaba
  // y se iba fuera del borde derecho en vez de bajar de línea.
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: 4, rowGap: 4 },
  metaRatingChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  metaTextSecondary: { fontSize: 12, color: colors.textSecondary, fontWeight: "600", flexShrink: 1 },

  actionsRow: {
  flexDirection: "row",
  gap: 22,
  marginTop: 22,
  paddingHorizontal: 20,
  paddingRight: 28,
},
  actionButton: { alignItems: "center", gap: 6 },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 11, fontWeight: "600", color: colors.text },

  section: { marginTop: 26 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 },
  // flex:1 + numberOfLines para que un título largo no empuje ni corte el
  // link "Ver todas" en pantallas angostas.
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: colors.text },
  linkText: { flexShrink: 0, fontSize: 13, fontWeight: "700", color: "#FB8C00" },
  paragraph: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  verMenuButton: {
    marginTop: 26,
    borderRadius: 26,
    overflow: "hidden",
    shadowColor: "#FB8C00",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  verMenuGradient: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  verMenuText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  mapWrap: { height: 130, borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  mapFallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surfaceSecondary,
  },
  mapFallbackText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  addressText: { flex: 1, fontSize: 13, color: colors.textSecondary },
  addressButtonsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  outlineButton: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 11,
  },
  outlineButtonText: { fontSize: 13, fontWeight: "700", color: colors.text },
  filledButton: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFA726",
    borderRadius: 20,
    paddingVertical: 11,
  },
  filledButtonText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },

  scheduleCard: {
    marginTop: 26,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  scheduleDay: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  scheduleHours: { fontSize: 13, color: colors.text, fontWeight: "700" },
  scheduleClosed: { fontSize: 13, color: colors.error, fontWeight: "700" },

  galleryThumb: { width: 84, height: 84, borderRadius: 12 },

  rateCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  rateCardTitle: { fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 10 },
  rateStarsRow: { flexDirection: "row", justifyContent: "center", marginBottom: 14 },
  rateCommentInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  rateSubmitButton: {
    backgroundColor: "#FB8C00",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  rateSubmitButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },

  reviewsSummaryRow: { flexDirection: "row", gap: 20, alignItems: "center", marginBottom: 18 },
  reviewsAvgWrap: { alignItems: "center" },
  reviewsAvgNumber: { fontSize: 30, fontWeight: "900", color: colors.text },
  reviewsAvgLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: "700" },
  distributionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  distributionStar: { fontSize: 11, color: colors.textSecondary, width: 10 },
  distributionTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.divider, overflow: "hidden" },
  distributionFill: { height: "100%", backgroundColor: "#FFA726" },

  reviewCard: { borderTopWidth: 1, borderTopColor: colors.divider, paddingVertical: 14 },
  reviewHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17 },
  reviewAvatarPlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  reviewName: { fontSize: 13, fontWeight: "700", color: colors.text },
  reviewDate: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  reviewStarsRow: { flexDirection: "row", gap: 1 },
  reviewComment: { fontSize: 12, color: colors.textSecondary, marginTop: 8, lineHeight: 18, fontStyle: "italic" },

  reviewsButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFA726",
    borderRadius: 22,
    paddingVertical: 13,
    marginTop: 8,
  },
  reviewsButtonText: { fontSize: 13, fontWeight: "700", color: "#FB8C00" },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.modalBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.text },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 16, lineHeight: 19 },

  reasonsList: { gap: 10, marginBottom: 18 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  reasonRowSelected: {
    borderColor: "#FB8C00",
    backgroundColor: colors.surfaceSecondary,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: "#FB8C00" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FB8C00" },
  reasonText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: "600" },

  modalFieldLabel: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 8 },
  modalTextarea: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    height: 90,
    textAlignVertical: "top",
    marginBottom: 8,
  },

  modalActionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalCancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalCancelButtonText: { fontSize: 15, fontWeight: "700", color: colors.textSecondary },
  modalSubmitButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FB8C00",
  },
  modalSubmitButtonDisabled: { opacity: 0.5 },
  modalSubmitButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
