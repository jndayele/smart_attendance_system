import React from 'react';

export default function QRCodeDisplay({ qrImageBase64, expired }) {
  if (!qrImageBase64 || expired) {
    return (
      <div className="flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 inline-flex items-center justify-center w-[238px] h-[238px]">
          <div className="text-center">
            <p className="text-[#0F1623] text-sm font-semibold">QR Expired</p>
            <p className="text-[#0F1623] text-xs mt-1 opacity-60">Click Refresh</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white rounded-xl p-4 inline-block">
        <img
          src={`data:image/png;base64,${qrImageBase64}`}
          alt="Session QR Code"
          className="w-52 h-52 object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}