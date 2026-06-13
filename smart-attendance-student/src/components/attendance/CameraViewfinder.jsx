import React from 'react';

export default function CameraViewfinder({ type = 'face', state = 'scanning', children }) {
  const isFace = type === 'face';
  const color = isFace ? 'var(--accent-purple)' : 'var(--accent-blue)';
  const successColor = 'var(--accent-green)';
  const isDetected = state === 'detected' || state === 'processing';

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-xl overflow-hidden"
      style={{ backgroundColor: '#000' }}>
      {/* Simulated camera feed */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(circle at center, #1a1a2e 0%, #000 100%)' }} />

        {/* Face: oval guide */}
        {isFace && (
          <div className="relative w-36 h-48 sm:w-44 sm:h-56">
            <div className="absolute inset-0 rounded-full border-2 border-dashed transition-all duration-500"
              style={{
                borderColor: isDetected ? successColor : 'rgba(255,255,255,0.4)',
                boxShadow: isDetected ? `0 0 20px ${successColor}40` : 'none',
              }} />
            {/* Corner brackets */}
            {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-5 h-5`}
                style={{
                  borderColor: isDetected ? successColor : color,
                  borderTopWidth: i < 2 ? '3px' : '0',
                  borderBottomWidth: i >= 2 ? '3px' : '0',
                  borderLeftWidth: i % 2 === 0 ? '3px' : '0',
                  borderRightWidth: i % 2 !== 0 ? '3px' : '0',
                  borderRadius: '4px',
                  transition: 'border-color 0.5s',
                }} />
            ))}
          </div>
        )}

        {/* QR: square guide */}
        {!isFace && (
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-8 h-8`}
                style={{
                  borderColor: isDetected ? successColor : color,
                  borderTopWidth: i < 2 ? '3px' : '0',
                  borderBottomWidth: i >= 2 ? '3px' : '0',
                  borderLeftWidth: i % 2 === 0 ? '3px' : '0',
                  borderRightWidth: i % 2 !== 0 ? '3px' : '0',
                  transition: 'border-color 0.5s',
                }} />
            ))}
          </div>
        )}

        {/* Scan line */}
        {state === 'scanning' && (
          <div className="absolute left-1/2 -translate-x-1/2 w-32 sm:w-40 h-0.5 animate-scan-line"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
              top: isFace ? '25%' : '20%',
            }} />
        )}
      </div>

      {/* Comment for devs */}
      {/* On actual devices this would use getUserMedia() — simulation only for prototype */}

      {/* Overlay content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center"
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
        {children}
      </div>
    </div>
  );
}