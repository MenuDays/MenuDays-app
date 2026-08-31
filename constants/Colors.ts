const tintColorLight = '#FFA726'; // tu primary
const tintColorDark = '#FFB74D';  // tu primaryLight, se ve mejor sobre fondo oscuro

// Paleta oscura: negro real de fondo (no marrón/sepia), con superficies
// grises neutras apenas más claras para diferenciar cards sin perder el
// negro como base. El naranja de marca sigue igual en ambos temas.
const darkBg = '#000000';
const darkSurface = '#121212';
const darkSurfaceAlt = '#1C1C1C';
const darkBorder = '#2A2A2A';

export default {
  light: {
    text: '#3E2723',
    textSecondary: '#757575',
    // "transparent" a propósito: el fondo real de la app es el patrón
    // global de <AppBackground>. Los contenedores que usan este token
    // dejan pasar el patrón (home, pedidos, perfil, dashboards). Las
    // pantallas de detalle/local/reseñas usan `screenSolid` -> fondo liso
    // blanco (claro) / negro (oscuro), como antes.
    background: 'transparent',
    screenSolid: '#FFFFFF',
    tint: tintColorLight,
    primary: '#FFA726',
    primaryDark: '#FB8C00',
    primaryLight: '#FFB74D',
    placeholder: '#9E9E9E',
    border: '#E0E0E0',
    success: '#4CAF50',
    error: '#F44336',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,

    // Tokens ampliados para el sistema Light/Dark
    surface: '#FFFFFF',
    surfaceSecondary: '#F7F5F3',
    card: '#FFFFFF',
    inputBackground: '#FAFAFA',
    inputBorder: '#E7E7E7',
    navbarBackground: '#FFFFFF',
    buttonText: '#FFFFFF',
    divider: '#F0F0F0',
    overlay: 'rgba(0,0,0,0.4)',
    modalBackground: '#FFFFFF',
    warning: '#FB8C00',
    info: '#2196F3',
    shadow: '#000000',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    // "transparent" -> deja ver el patrón global (fondo_oscuro). Las
    // pantallas de detalle usan `screenSolid` -> negro liso, como antes.
    background: 'transparent',
    screenSolid: '#000000',
    tint: tintColorDark,
    primary: '#FFA94D',
    primaryDark: '#FB8C00',
    primaryLight: '#FFB74D',
    placeholder: '#7A7A7A',
    border: darkBorder,
    success: '#66BB6A',
    error: '#EF5350',
    tabIconDefault: '#7A7A7A',
    tabIconSelected: tintColorDark,

    // Tokens ampliados para el sistema Light/Dark
    surface: darkSurface,
    surfaceSecondary: darkSurfaceAlt,
    card: darkSurface,
    inputBackground: darkSurfaceAlt,
    inputBorder: darkBorder,
    navbarBackground: darkSurface,
    buttonText: '#FFFFFF',
    divider: darkBorder,
    overlay: 'rgba(0,0,0,0.6)',
    modalBackground: darkSurface,
    warning: '#FFB74D',
    info: '#64B5F6',
    shadow: '#000000',
  },
};