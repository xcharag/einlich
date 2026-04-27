import React, { useEffect, useRef } from 'react';
import videoUrl from '../../content/Polera2026.mp4';

export default function VideoModal({ onClose }) {
  const videoRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    // Prevent body scroll while open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Video de la polera 2026"
    >
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        <p className="modal-title">🎽 Polera 2026</p>
        <video
          ref={videoRef}
          src={videoUrl}
          className="modal-video"
          controls
          autoPlay
          playsInline
          preload="metadata"
        />
      </div>
    </div>
  );
}
