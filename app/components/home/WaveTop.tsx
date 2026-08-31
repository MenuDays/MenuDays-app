import Svg, { Path } from 'react-native-svg';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

const VB_WIDTH = 412;
const VB_HEIGHT = 20;
const BITE = 2; // cuánto "muerde" hacia arriba, en la misma escala del viewBox

// El fondo de la app ahora es un patrón global (ver AppBackground), no un
// color plano -> la onda va TRANSPARENTE (antes se rellenaba de blanco y
// quedaba una franja blanca entre el header y el contenido). El borde
// ondulado del header lo da WaveBottom (naranja).
export default function WaveTop() {
  const { width } = useWindowDimensions();
  const scale = width / VB_WIDTH;

  return (
    <View style={[styles.wrap, { marginTop: -BITE * scale }]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`} preserveAspectRatio="none">
        <Path
          d="M188 0.00342374C115.041 -0.274409 0 16.4496 0 16.4496V20H412V16.4496C412 16.4496 348.882 11.3123 305.5 5.48549C270.423 0.77414 233.893 0.178186 188 0.00342374Z"
          fill="transparent"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: VB_WIDTH / VB_HEIGHT,
    zIndex: 10,          // asegura que quede por encima del header naranja
    elevation: 10,       // necesario en Android para que el zIndex tenga efecto real
  },
});