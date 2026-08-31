import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

// En nativo (iOS/Android) esto reexporta el MapView real de
// react-native-maps tal cual, sin ningún cambio de comportamiento.
// La versión que corre en la preview web es SafeMapView.web.tsx --
// Metro la resuelve automáticamente por el sufijo ".web" cuando el
// bundle target es "web", así que los componentes que consumen esto
// (MapLocationPicker, restaurante-detalle) no necesitan ningún
// Platform.OS check.
export default MapView;
export { Marker, PROVIDER_GOOGLE };
export type { Region };
