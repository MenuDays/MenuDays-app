import { View } from 'react-native';

type BlobConfig = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
};

// Valores tomados directo de tu SVG: <Ellipse cx cy rx ry /> + opacity del <G>
const BLOBS: BlobConfig[] = [
  { cx: 63, cy: 50, rx: 14, ry: 35, opacity: 0.4 },
  { cx: 24.5, cy: 61, rx: 14.5, ry: 40, opacity: 0.2 },
  { cx: 104, cy: 57.5, rx: 9, ry: 32.5, opacity: 0.25 },
];

// Capas concéntricas que simulan el degradé del blur gaussiano
const LAYERS = [
  { scale: 2.4, opacityFactor: 0.12 },
  { scale: 1.8, opacityFactor: 0.22 },
  { scale: 1.3, opacityFactor: 0.4 },
  { scale: 1.0, opacityFactor: 0.6 },
];

function Blob({ cx, cy, rx, ry, opacity }: BlobConfig) {
  const w = rx * 2;
  const h = ry * 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {LAYERS.map((layer, i) => {
        const lw = w * layer.scale;
        const lh = h * layer.scale;
        const maxDim = Math.max(lw, lh);
        const scaleX = lw / maxDim;
        const scaleY = lh / maxDim;

        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: maxDim,
              height: maxDim,
              borderRadius: maxDim / 2,
              backgroundColor: `rgba(255,255,255,${opacity * layer.opacityFactor})`,
              transform: [{ scaleX }, { scaleY }],
            }}
          />
        );
      })}
    </View>
  );
}

type Props = {
  width?: number;
  height?: number;
};

// viewBox original del diseño: 121x111
const VB_W = 121;
const VB_H = 111;

export default function VaporSVG({ width = VB_W, height = VB_H }: Props) {
  const scaleX = width / VB_W;
  const scaleY = height / VB_H;

  return (
    <View style={{ width, height }}>
      <View
        style={{
          width: VB_W,
          height: VB_H,
          transform: [{ scaleX }, { scaleY }],
        }}
      >
        {BLOBS.map((b, i) => (
          <Blob key={i} {...b} />
        ))}
      </View>
    </View>
  );
}