import React from 'react';

export default function QRCodeDisplay() {
  // Decorative QR-like pattern
  const size = 17;
  const pattern = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      // Fixed position patterns (corners)
      if ((row < 7 && col < 7) || (row < 7 && col >= size - 7) || (row >= size - 7 && col < 7)) {
        if (row === 0 || row === 6 || col === 0 || col === 6 || (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
          (row === 0 || row === 6) || (col === 0 || col === 6)) {
          if (row >= 1 && row <= 5 && col >= 1 && col <= 5 && !(row >= 2 && row <= 4 && col >= 2 && col <= 4)) return false;
          return true;
        }
        return false;
      }
      return Math.random() > 0.5;
    })
  );

  const cellSize = 14;

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 inline-block">
        <svg width={size * cellSize} height={size * cellSize} viewBox={`0 0 ${size * cellSize} ${size * cellSize}`}>
          {pattern.map((row, ri) =>
            row.map((filled, ci) =>
              filled ? (
                <rect key={`${ri}-${ci}`} x={ci * cellSize} y={ri * cellSize}
                  width={cellSize} height={cellSize} fill="#0F1623" />
              ) : null
            )
          )}
        </svg>
      </div>
    </div>
  );
}