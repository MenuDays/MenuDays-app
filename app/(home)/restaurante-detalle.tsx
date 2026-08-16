import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
// TODO: si el proyecto todavía no tiene "expo-clipboard" instalado,
// correr `npx expo install expo-clipboard` (se usa para "Copiar dirección").
import * as Clipboard from "expo-clipboard";

import FavoriteService from "../../services/favorite.service";
import LocationService from "../../services/location.service";
import RestaurantService, { RestaurantPublicDetail } from "../../services/restaurant.service";
import ReviewService, { Review } from "../../services/review.service";
import ReportService, { ReportReason } from "../../services/report.service";
import { AppAlert } from "../components/common/AppAlert";

const DAY_NAMES = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface Props {
  previewRestaurantId?: string;
  ownerPreview?: boolean;
}

export default function RestauranteDetalleScreen({
  previewRestaurantId,
  ownerPreview = false,
}: Props) {
const { id: routeId } = useLocalSearchParams<{ id: string }>();

const restaurantId = previewRestaurantId ?? routeId;

  const [restaurant, setRestaurant] = useState<RestaurantPublicDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  // Distancia calculada en el cliente a partir de la última ubicación
  // guardada del usuario (LocationService) + lat/lng del restaurante.
  // No hay endpoint que la devuelva calculada desde el back.
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // "Para pedir" (Menú del día / Platos / Promociones) se muestra en
  // pestañas -- antes las 3 secciones iban una debajo de la otra siempre
  // visibles, y quedaba una pantalla larguísima con todo apilado. Se
  // arranca en la primera que tenga contenido (ver efecto más abajo).
  const [catalogTab, setCatalogTab] = useState<"menus" | "platos" | "promos">("menus");

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReasons, setReportReasons] = useState<ReportReason[]>([]);
  const [reportReasonsLoading, setReportReasonsLoading] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

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
    Promise.all([
      RestaurantService.getPublicDetail(restaurantId),
      ReviewService.getRestaurantReviews(restaurantId),
      // GET /favorites ya existe y trae el listado completo del usuario;
      // no hay un endpoint "¿es favorito?" puntual, así que se deriva acá.
      FavoriteService.getAll().catch(() => []),
      LocationService.getUserLocation().catch(() => null),
    ])
      .then(([restaurantData, reviewsData, favoritesData, userLocation]) => {
        setRestaurant(restaurantData);
        setReviews(reviewsData);
        setIsFavorite(favoritesData.some((f) => f.restaurant.id === restaurantData.id));

        const { lat, lng } = restaurantData.ubicacion;
        if (userLocation && lat != null && lng != null) {
          setDistanceKm(
            haversineKm(userLocation.latitude, userLocation.longitude, lat, lng)
          );
        }
      })
      .catch((e: any) => {
        const msg = e.message || "No se pudo cargar el restaurante.";
        setError(msg);
        AppAlert.alert("Error", msg);
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const scheduleGroups = useMemo(
    () => (restaurant ? groupSchedule(restaurant.horarios) : []),
    [restaurant]
  );

  const ratingDistribution = useMemo(() => buildDistribution(reviews), [reviews]);

  // Arranca en la primera pestaña de "Para pedir" que tenga contenido
  // (menús > platos > promos), cada vez que cambia de restaurante.
  useEffect(() => {
    if (!restaurant) return;
    if (restaurant.menus.length > 0) setCatalogTab("menus");
    else if (restaurant.platos.length > 0) setCatalogTab("platos");
    else if (restaurant.promociones.length > 0) setCatalogTab("promos");
  }, [restaurant]);

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
        <Ionicons name="cloud-offline-outline" size={36} color="#D9D9D9" />
        <Text style={{ marginTop: 10, textAlign: "center", color: "#9E9E9E", fontSize: 13, lineHeight: 19, paddingHorizontal: 30 }}>
          {error || "No se pudo cargar el restaurante."}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 14, backgroundColor: "#FB8C00", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { lat, lng } = restaurant.ubicacion;

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.coverWrap}>
          {restaurant.portadaUrl ? (
            <Image source={{ uri: restaurant.portadaUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Ionicons name="image-outline" size={32} color="#C9C9C9" />
            </View>
          )}

          <SafeAreaView style={styles.coverOverlay} edges={["top"]}>
            <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color="#3E2723" />
            </TouchableOpacity>

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
              <Image source={{ uri: restaurant.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Ionicons name="restaurant-outline" size={20} color="#BDBDBD" />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{restaurant.nombreComercial}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="star" size={13} color="#F5A800" />
                <Text style={styles.metaText}>{restaurant.calificacionPromedio.toFixed(1)}</Text>
                {restaurant.categorias.length > 0 && (
                  <Text style={styles.metaText} numberOfLines={1}>
                    {" "}
                    · {restaurant.categorias.map((c) => c.categoria.nombre).join(", ")}
                  </Text>
                )}
                {distanceKm != null && (
                  <Text style={styles.metaText}> · {formatDistance(distanceKm)}</Text>
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
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="restaurant" size={18} color="#FB8C00" />
                <Text style={styles.sectionTitle}>Para pedir</Text>
              </View>

              <View style={styles.catalogTabsRow}>
                {restaurant.menus.length > 0 && (
                  <TouchableOpacity
                    style={[styles.catalogTab, catalogTab === "menus" && styles.catalogTabActive]}
                    onPress={() => setCatalogTab("menus")}
                  >
                    <Text style={[styles.catalogTabText, catalogTab === "menus" && styles.catalogTabTextActive]}>
                      Menú del día
                    </Text>
                  </TouchableOpacity>
                )}
                {restaurant.platos.length > 0 && (
                  <TouchableOpacity
                    style={[styles.catalogTab, catalogTab === "platos" && styles.catalogTabActive]}
                    onPress={() => setCatalogTab("platos")}
                  >
                    <Text style={[styles.catalogTabText, catalogTab === "platos" && styles.catalogTabTextActive]}>
                      Platos
                    </Text>
                  </TouchableOpacity>
                )}
                {restaurant.promociones.length > 0 && (
                  <TouchableOpacity
                    style={[styles.catalogTab, catalogTab === "promos" && styles.catalogTabActive]}
                    onPress={() => setCatalogTab("promos")}
                  >
                    <Text style={[styles.catalogTabText, catalogTab === "promos" && styles.catalogTabTextActive]}>
                      Promociones
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {catalogTab === "menus" &&
                restaurant.menus.map((menu) => (
                  <View key={menu.id} style={styles.menuCard}>
                    {menu.foto_url ? (
                      <Image source={{ uri: menu.foto_url }} style={styles.menuImage} />
                    ) : (
                      <View style={[styles.menuImage, styles.menuImagePlaceholder]}>
                        <Ionicons name="restaurant-outline" size={18} color="#BDBDBD" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={styles.menuTopRow}>
                        <Text style={styles.menuName} numberOfLines={1}>
                          {menu.nombre}
                        </Text>
                        <View style={styles.priceBadge}>
                          <Text style={styles.priceBadgeText}>${menu.precio.toFixed(2)}</Text>
                        </View>
                      </View>
                      {menu.descripcion ? (
                        <Text style={styles.menuDescription} numberOfLines={2}>
                          {menu.descripcion}
                        </Text>
                      ) : null}
                      {/* Va al detalle de producto (pedido-producto.tsx), no
                          arma el pedido acá directo. Esa pantalla es la que
                          tiene el botón real "Realizar pedido". */}
                      {!ownerPreview && (
                        <TouchableOpacity
                          style={styles.pedirButton}
                          onPress={() =>
                            router.push({
                              pathname: "/(home)/pedido-producto",
                              params: {
                                id: menu.id,
                                tipo: "menu_dia",
                                ofreceDelivery: String(restaurant.ofreceDelivery),
                                nombreDelivery: restaurant.nombreDelivery ?? "",
                              },
                            })
                          }
                        >
                          <Text style={styles.pedirButtonText}>Pedir</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}

              {catalogTab === "platos" &&
                restaurant.platos.map((plato) => (
                  <View key={plato.id} style={styles.menuCard}>
                    {plato.plato_imagenes[0]?.url ? (
                      <Image source={{ uri: plato.plato_imagenes[0].url }} style={styles.menuImage} />
                    ) : (
                      <View style={[styles.menuImage, styles.menuImagePlaceholder]}>
                        <Ionicons name="fast-food-outline" size={18} color="#BDBDBD" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={styles.menuTopRow}>
                        <Text style={styles.menuName} numberOfLines={1}>
                          {plato.nombre}
                        </Text>
                        <View style={styles.priceBadge}>
                          <Text style={styles.priceBadgeText}>${plato.precio.toFixed(2)}</Text>
                        </View>
                      </View>
                      {plato.descripcion ? (
                        <Text style={styles.menuDescription} numberOfLines={2}>
                          {plato.descripcion}
                        </Text>
                      ) : null}
                      {!ownerPreview && (
                        <TouchableOpacity
                          style={styles.pedirButton}
                          onPress={() =>
                            router.push({
                              pathname: "/(home)/pedido-producto",
                              params: {
                                id: plato.id,
                                tipo: "plato",
                                ofreceDelivery: String(restaurant.ofreceDelivery),
                                nombreDelivery: restaurant.nombreDelivery ?? "",
                              },
                            })
                          }
                        >
                          <Text style={styles.pedirButtonText}>Pedir</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}

              {catalogTab === "promos" &&
                restaurant.promociones.map((promo) => (
                  <View key={promo.id} style={styles.menuCard}>
                    {promo.imagen_url ? (
                      <Image source={{ uri: promo.imagen_url }} style={styles.menuImage} />
                    ) : (
                      <View style={[styles.menuImage, styles.menuImagePlaceholder]}>
                        <Ionicons name="pricetag-outline" size={18} color="#BDBDBD" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={styles.menuTopRow}>
                        <Text style={styles.menuName} numberOfLines={1}>
                          {promo.titulo}
                        </Text>
                        <View style={styles.priceBadge}>
                          <Text style={styles.priceBadgeText}>${promo.precio.toFixed(2)}</Text>
                        </View>
                      </View>
                      {promo.descripcion ? (
                        <Text style={styles.menuDescription} numberOfLines={2}>
                          {promo.descripcion}
                        </Text>
                      ) : null}
                      {!ownerPreview && (
                        <TouchableOpacity
                          style={styles.pedirButton}
                          onPress={() =>
                            router.push({
                              pathname: "/(home)/pedido-producto",
                              params: {
                                id: promo.id,
                                tipo: "promocion",
                                ofreceDelivery: String(restaurant.ofreceDelivery),
                                nombreDelivery: restaurant.nombreDelivery ?? "",
                              },
                            })
                          }
                        >
                          <Text style={styles.pedirButtonText}>Pedir</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación y Contacto</Text>

            {lat != null && lng != null && (
              <View style={styles.mapWrap}>
                <MapView
                  style={{ flex: 1 }}
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
              </View>
            )}

            {restaurant.direccion ? (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color="#9E9E9E" />
                <Text style={styles.addressText}>
                  {restaurant.direccion}
                  {restaurant.ciudad ? `, ${restaurant.ciudad.nombre}, ${restaurant.ciudad.provincia.nombre}` : ""}
                </Text>
              </View>
            ) : null}

            <View style={styles.addressButtonsRow}>
              <TouchableOpacity style={styles.outlineButton} onPress={handleCopiarDireccion}>
                <Ionicons name="copy-outline" size={15} color="#3E2723" />
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
                  <Image key={img.id} source={{ uri: img.url }} style={styles.galleryThumb} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reseñas de la comunidad</Text>

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
                      <Ionicons name="person" size={14} color="#BDBDBD" />
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
                        color={i < review.calificacion ? "#F5A800" : "#E0E0E0"}
                      />
                    ))}
                  </View>
                </View>
                {review.comentario ? <Text style={styles.reviewComment}>"{review.comentario}"</Text> : null}
              </View>
            ))}

            {/* TODO: navegar a una pantalla con el listado completo de
                reseñas (con paginación) cuando exista. */}
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

      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseReport}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reportar restaurante</Text>
              <TouchableOpacity onPress={handleCloseReport} disabled={submittingReport} hitSlop={10}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubtitle}>
                Contanos qué ocurrió para que podamos revisarlo.
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
                placeholder="Contanos más detalles..."
                placeholderTextColor="#B0B0B0"
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
          </View>
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
  horarios.forEach((h) => byDay.set(h.dia_semana, h));

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },

  coverWrap: { height: 220, backgroundColor: "#F5F5F5" },
  cover: { width: "100%", height: "100%" },
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
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  content: { padding: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: -44 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
  logoPlaceholder: { alignItems: "center", justifyContent: "center" },
  name: { fontSize: 19, fontWeight: "900", color: "#1A1A1A" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  metaText: { fontSize: 12, color: "#757575", fontWeight: "600" },

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
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 11, fontWeight: "600", color: "#3E2723" },

  section: { marginTop: 26 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  linkText: { fontSize: 13, fontWeight: "700", color: "#FB8C00" },
  paragraph: { fontSize: 13, color: "#5C5C5C", lineHeight: 20 },

  catalogTabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  catalogTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  catalogTabActive: { backgroundColor: "#FB8C00", borderColor: "#FB8C00" },
  catalogTabText: { fontSize: 12.5, fontWeight: "700", color: "#5C5C5C" },
  catalogTabTextActive: { color: "#FFFFFF" },
  menuCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  menuImage: { width: 64, height: 64, borderRadius: 12 },
  menuImagePlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  menuTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  menuName: { flex: 1, fontSize: 14, fontWeight: "800", color: "#1A1A1A" },
  menuDescription: { fontSize: 12, color: "#9E9E9E", marginTop: 4 },
  priceBadge: { backgroundColor: "#FFA726", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  priceBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  pedirButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#FB8C00",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pedirButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },

  mapWrap: { height: 130, borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  addressText: { flex: 1, fontSize: 13, color: "#5C5C5C" },
  addressButtonsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  outlineButton: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingVertical: 11,
  },
  outlineButtonText: { fontSize: 13, fontWeight: "700", color: "#3E2723" },
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
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 16,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  scheduleDay: { fontSize: 13, color: "#5C5C5C", fontWeight: "600" },
  scheduleHours: { fontSize: 13, color: "#1A1A1A", fontWeight: "700" },
  scheduleClosed: { fontSize: 13, color: "#E53935", fontWeight: "700" },

  galleryThumb: { width: 84, height: 84, borderRadius: 12 },

  reviewsSummaryRow: { flexDirection: "row", gap: 20, alignItems: "center", marginBottom: 18 },
  reviewsAvgWrap: { alignItems: "center" },
  reviewsAvgNumber: { fontSize: 30, fontWeight: "900", color: "#1A1A1A" },
  reviewsAvgLabel: { fontSize: 10, color: "#9E9E9E", fontWeight: "700" },
  distributionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  distributionStar: { fontSize: 11, color: "#9E9E9E", width: 10 },
  distributionTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "#F0F0F0", overflow: "hidden" },
  distributionFill: { height: "100%", backgroundColor: "#FFA726" },

  reviewCard: { borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingVertical: 14 },
  reviewHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17 },
  reviewAvatarPlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  reviewName: { fontSize: 13, fontWeight: "700", color: "#1A1A1A" },
  reviewDate: { fontSize: 11, color: "#9E9E9E", marginTop: 1 },
  reviewStarsRow: { flexDirection: "row", gap: 1 },
  reviewComment: { fontSize: 12, color: "#5C5C5C", marginTop: 8, lineHeight: 18, fontStyle: "italic" },

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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
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
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1A1A1A" },
  modalSubtitle: { fontSize: 13, color: "#9E9E9E", marginBottom: 16, lineHeight: 19 },

  reasonsList: { gap: 10, marginBottom: 18 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  reasonRowSelected: {
    borderColor: "#FB8C00",
    backgroundColor: "#FFF3E0",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: "#FB8C00" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FB8C00" },
  reasonText: { flex: 1, fontSize: 14, color: "#1A1A1A", fontWeight: "600" },

  modalFieldLabel: { fontSize: 13, fontWeight: "600", color: "#1A1A1A", marginBottom: 8 },
  modalTextarea: {
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A1A1A",
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
    borderColor: "#E0E0E0",
  },
  modalCancelButtonText: { fontSize: 15, fontWeight: "700", color: "#9E9E9E" },
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