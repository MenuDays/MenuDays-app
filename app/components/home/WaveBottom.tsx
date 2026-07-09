import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

const WAVE_PATH = "M82.5 1.89044C48.451 8.50762 0 39.9405 0 39.9405V49H412V30.8809C412 30.8809 369.119 16.0967 341 16.3857C314.227 16.6608 300.266 30.1278 273.5 30.8809C242.689 31.7479 195.5 16.3857 195.5 16.3857C195.5 16.3857 126.314 -6.62449 82.5 1.89044Z";

const BASE_W = 412;
const BASE_H = 70;

// las 3 ocupan el 100% del ancho siempre; solo varía qué tan
// "achatada" (profunda) es cada una, y el color/gradiente.
const LAYERS = [
  { scaleY: 1 },    // atrás: forma completa, más profunda
  { scaleY: 0.7 },  // media
  { scaleY: 0.45 }, // frente: la más achatada / clara, la que se ve como resplandor
];

const VB_WIDTH = BASE_W;  // igual al ancho base: cada capa cubre 0→412 entero
const VB_HEIGHT = BASE_H;

export default function WaveBottom() {
  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="wave1" x1="0" y1="0" x2={BASE_W} y2="0" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#FFB74D" />
            <Stop offset="1" stopColor="#FFCC80" stopOpacity={0.5} />
          </LinearGradient>
          <LinearGradient id="wave2" x1="0" y1="0" x2={BASE_W} y2="0" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#FFB74D" />
            <Stop offset="1" stopColor="#FFA726" stopOpacity={0.8} />
          </LinearGradient>
          <LinearGradient id="wave3" x1="0" y1="0" x2={BASE_W} y2="0" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#FFB74D" />
            <Stop offset="1" stopColor="#FB8C00" />
          </LinearGradient>
        </Defs>

        {LAYERS.map((layer, i) => (
          <Path
            key={i}
            d={WAVE_PATH}
            fill={`url(#wave${i + 1})`}
            transform={`translate(0, ${BASE_H - layer.scaleY * BASE_H}) scale(1, ${layer.scaleY})`}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: VB_WIDTH / VB_HEIGHT,
  },
});