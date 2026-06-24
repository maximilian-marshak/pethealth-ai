// ══════════════════════════════════════════════════════════════
// src/components/dashboard/WeightSparkline.js
// Лёгкий линейный sparkline веса (react-native-svg, без тяжёлых либ).
// Линия + мягкая заливка под ней. Цвета приходят пропами из theme-токенов
// (color — линия = accent; fillColor — заливка = accent + низкая alpha).
// Ширину получаем через onLayout (адаптивно к карточке), высота — проп.
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Polygon } from 'react-native-svg';

export default function WeightSparkline({ data, color, fillColor, height = 56, strokeWidth = 2.5, style }) {
  const [w, setW] = useState(0);
  if (!data || data.length < 2) return null;

  const pad = strokeWidth;                 // отступ, чтобы линия не обрезалась по краям
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;            // защита от деления на ноль (все значения равны)
  const innerH = height - pad * 2;

  const toCoords = (width) =>
    data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (v - min) / range) * innerH;
      return [x, y];
    });

  return (
    <View style={[{ height }, style]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (() => {
        const pts = toCoords(w);
        const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
        const area = `${pad},${height} ${line} ${w - pad},${height}`;
        return (
          <Svg width={w} height={height}>
            <Polygon points={area} fill={fillColor} />
            <Polyline
              points={line}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </Svg>
        );
      })()}
    </View>
  );
}
