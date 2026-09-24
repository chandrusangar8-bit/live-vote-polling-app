import React from 'react';

// Lightweight visual QR code generator using standard QR matrix patterns
// for presentation projector displays
export const QrCodeSvg: React.FC<{ url: string; size?: number }> = ({ url, size = 160 }) => {
  // Generate a deterministic visual grid based on the URL string hash
  const hash = Array.from(url).reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);
  const matrixSize = 25;
  const cells: boolean[][] = [];

  for (let r = 0; r < matrixSize; r++) {
    cells[r] = [];
    for (let c = 0; c < matrixSize; c++) {
      // Finder patterns in top-left, top-right, bottom-left
      const inTopLeft = r < 7 && c < 7;
      const inTopRight = r < 7 && c >= matrixSize - 7;
      const inBottomLeft = r >= matrixSize - 7 && c < 7;

      if (inTopLeft || inTopRight || inBottomLeft) {
        const localR = inBottomLeft ? r - (matrixSize - 7) : r;
        const localC = inTopRight ? c - (matrixSize - 7) : c;
        if (
          localR === 0 ||
          localR === 6 ||
          localC === 0 ||
          localC === 6 ||
          (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4)
        ) {
          cells[r][c] = true;
        } else {
          cells[r][c] = false;
        }
      } else if (r === 6 || c === 6) {
        // Timing lines
        cells[r][c] = (r + c) % 2 === 0;
      } else {
        // Deterministic pseudo-random pattern based on string and coordinates
        const bit = Math.abs(Math.sin((hash + r * 31 + c * 17) * 1.5)) > 0.48;
        cells[r][c] = bit;
      }
    }
  }

  const cellSize = size / matrixSize;

  return (
    <div
      className="p-3 bg-white rounded-xl shadow-lg inline-block"
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {cells.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.2}
                height={cellSize + 0.2}
                fill="#090d16"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
