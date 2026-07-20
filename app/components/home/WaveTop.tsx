import Svg, { Path } from 'react-native-svg';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

const VB_WIDTH = 412;
const VB_HEIGHT = 20;
const BITE = 2; // cuánto "muerde" hacia arriba, en la misma escala del viewBox

export default function WaveTop() {
  const { width } = useWindowDimensions();
  const scale = width / VB_WIDTH;

  return (
    <View style={[styles.wrap, { marginTop: -BITE * scale }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`} preserveAspectRatio="none">
        <Path
          d="M188 0.00342374C115.041 -0.274409 0 16.4496 0 16.4496V20H412V16.4496C412 16.4496 348.882 11.3123 305.5 5.48549C270.423 0.77414 233.893 0.178186 188 0.00342374Z"
          fill="#FFFFFF"
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