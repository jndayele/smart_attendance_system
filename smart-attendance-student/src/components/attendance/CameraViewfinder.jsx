import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import jsQR from 'jsqr';

const CameraViewfinder = forwardRef(({ type = 'face', state = 'scanning', children }, ref) => {
  const isFace = type === 'face';
  const color = isFace ? 'var(--accent-purple)' : 'var(--accent-blue)';
  const successColor = 'var(--accent-green)';
  const isDetected = state === 'detected' || state === 'processing';
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: isFace ? 'user' : 'environment' } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Camera access denied or unavailable.');
        console.error('Camera error:', err);
      }
    }
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isFace]);

  useImperativeHandle(ref, () => ({
    captureImage: () => {
      if (!videoRef.current) return null;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.9);
      });
    },
    scanQR: () => {
      if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return null;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      return code ? code.data : null;
    }
  }));

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-xl overflow-hidden"
      style={{ backgroundColor: '#000' }}>
      
      {/* Real camera feed */}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm p-4 text-center">
          {error}
        </div>
      ) : (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: isFace ? 'scaleX(-1)' : 'none' }}
        />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Darkened edges */}
        <div className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(circle at center, transparent 30%, #000 100%)' }} />

        {/* Face: oval guide */}
        {isFace && !error && (
          <div className="relative w-36 h-48 sm:w-44 sm:h-56">
            <div className="absolute inset-0 rounded-[40%] border-2 border-dashed transition-all duration-500"
              style={{
                borderColor: isDetected ? successColor : 'rgba(255,255,255,0.4)',
                boxShadow: isDetected ? `0 0 20px ${successColor}40` : 'none',
              }} />
            {/* Corner brackets */}
            {['-top-2 -left-2', '-top-2 -right-2', '-bottom-2 -left-2', '-bottom-2 -right-2'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-6 h-6`}
                style={{
                  borderColor: isDetected ? successColor : color,
                  borderTopWidth: i < 2 ? '3px' : '0',
                  borderBottomWidth: i >= 2 ? '3px' : '0',
                  borderLeftWidth: i % 2 === 0 ? '3px' : '0',
                  borderRightWidth: i % 2 !== 0 ? '3px' : '0',
                  borderRadius: '6px',
                  transition: 'border-color 0.5s',
                }} />
            ))}
          </div>
        )}

        {/* QR: square guide */}
        {!isFace && !error && (
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            {['-top-2 -left-2', '-top-2 -right-2', '-bottom-2 -left-2', '-bottom-2 -right-2'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-8 h-8`}
                style={{
                  borderColor: isDetected ? successColor : color,
                  borderTopWidth: i < 2 ? '3px' : '0',
                  borderBottomWidth: i >= 2 ? '3px' : '0',
                  borderLeftWidth: i % 2 === 0 ? '3px' : '0',
                  borderRightWidth: i % 2 !== 0 ? '3px' : '0',
                  borderRadius: '6px',
                  transition: 'border-color 0.5s',
                }} />
            ))}
          </div>
        )}

        {/* Scan line */}
        {state === 'scanning' && !error && (
          <div className="absolute left-1/2 -translate-x-1/2 w-32 sm:w-40 h-0.5 animate-scan-line"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
              top: isFace ? '25%' : '20%',
            }} />
        )}
      </div>

      {/* Overlay content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center z-10"
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
        {children}
      </div>
    </div>
  );
});

export default CameraViewfinder;