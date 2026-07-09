import Svg, { Path, Ellipse } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string; // color del cuerpo del cloche (blanco por defecto, como en tu SVG)
  accentColor?: string; // color del brillito curvo (FFB74D por defecto)
};

export default function ClocheIcon({ size = 20, color = '#FFFFFF', accentColor = '#FFB74D' }: Props) {
  // viewBox original 30x20, mantenemos la proporción 3:2
  const width = size;
  const height = (size * 20) / 30;

  return (
    <Svg width={width} height={height} viewBox="0 0 30 20" fill="none">
      <Path
        d="M0 18.3674C0 17.4657 0.730964 16.7347 1.63265 16.7347H28.3673C29.269 16.7347 30 17.4657 30 18.3674C30 19.2691 29.269 20 28.3673 20H1.63265C0.730963 20 0 19.2691 0 18.3674Z"
        fill={color}
      />
      <Path
        d="M0 15.5102C0 8.18395 5.93908 2.24487 13.2653 2.24487H16.7347C24.0609 2.24487 30 8.18395 30 15.5102H0Z"
        fill={color}
      />
      <Ellipse cx="14.9999" cy="1.83673" rx="1.92857" ry="1.83673" fill={color} />
      <Path
        d="M5.5 11.5C5.5 11.5 6.5 6 11.5 6.49997"
        stroke={accentColor}
        strokeLinecap="round"
      />
    </Svg>
  );
}