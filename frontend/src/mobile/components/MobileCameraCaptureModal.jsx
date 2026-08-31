import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check, AlertTriangle, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function MobileCameraCaptureModal({ isOpen, onClose, onCapture }) {
  const [stream, setStream] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // Rear camera

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileFallbackRef = useRef(null);

  // Initialize Camera Stream
  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError('');

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) not supported in this browser. Using direct camera capture fallback.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn('Video play notice:', e));
      }
    } catch (err) {
      console.warn('getUserMedia error:', err);
      let errorMsg = 'Could not access device camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera access in your browser site settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No rear camera hardware found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is already in use by another application.';
      }
      setCameraError(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedPreview(null);
      setCapturedBlob(null);
      startCamera();
    } else {
      // Stop camera when modal closes
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (capturedPreview) {
        URL.revokeObjectURL(capturedPreview);
        setCapturedPreview(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (capturedPreview) {
        URL.revokeObjectURL(capturedPreview);
      }
    };
  }, [isOpen]);

  // Keep videoRef srcObject synced
  useEffect(() => {
    if (videoRef.current && stream && !capturedPreview) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, capturedPreview]);

  if (!isOpen) return null;

  // Capture current video frame & compress for zero memory leaks
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Ensure video is playing and has dimensions
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;

    // Constrain max dimensions to prevent low-memory crashes on mobile devices
    const MAX_WIDTH = 1400;
    const MAX_HEIGHT = 1050;
    let targetWidth = videoWidth;
    let targetHeight = videoHeight;

    if (targetWidth > MAX_WIDTH || targetHeight > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / targetWidth, MAX_HEIGHT / targetHeight);
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    // Stop active camera stream tracks immediately to release hardware & memory
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Convert canvas to optimized JPEG Blob (quality 0.85)
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError('Failed to encode captured photo.');
        return;
      }
      const previewUrl = URL.createObjectURL(blob);
      setCapturedBlob(blob);
      setCapturedPreview(previewUrl);
    }, 'image/jpeg', 0.85);
  };

  // Retake photo
  const handleRetake = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
      setCapturedPreview(null);
      setCapturedBlob(null);
    }
    startCamera();
  };

  // Confirm photo and send to caller
  const handleConfirmPhoto = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `evidence_${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture({ file, previewUrl: capturedPreview });
    onClose();
  };

  // Fallback direct camera capture handler (if browser blocks WebRTC)
  const handleFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Process fallback image through offscreen canvas to scale and optimize
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1050;
        let w = img.width;
        let h = img.height;
        if (w > MAX_WIDTH || h > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / w, MAX_HEIGHT / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (blob) {
            const previewUrl = URL.createObjectURL(blob);
            setCapturedBlob(blob);
            setCapturedPreview(previewUrl);
          }
        }, 'image/jpeg', 0.85);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-between animate-in fade-in duration-200 safe-area-all">
      
      {/* Top Controls Bar */}
      <div className="p-4 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            {capturedPreview ? 'PHOTO PREVIEW' : 'REAR CAMERA • LIVE'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-slate-900/80 border border-slate-700 text-white flex items-center justify-center active:scale-90"
        >
          <X size={20} />
        </button>
      </div>

      {/* Viewfinder Center Area */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden">
        
        {/* Error Banner */}
        {cameraError && !capturedPreview && (
          <div className="p-5 max-w-sm mx-auto text-center space-y-4 z-30">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Camera Access Notice</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
            </div>
            
            <div className="space-y-2 pt-2">
              <button
                onClick={startCamera}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Retry Live Camera
              </button>
              
              {/* Direct native camera launch fallback */}
              <button
                onClick={() => fileFallbackRef.current?.click()}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Camera size={14} /> Launch Device Camera App
              </button>
              <input
                ref={fileFallbackRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFallbackFile}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Live Video Feed */}
        {!capturedPreview && !cameraError && (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Viewfinder Target Grid */}
            <div className="absolute inset-8 border border-white/20 rounded-3xl pointer-events-none flex items-center justify-center">
              <div className="w-16 h-16 border-2 border-amber-400/80 rounded-2xl animate-pulse flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
            </div>
          </>
        )}

        {/* Captured Photo Preview */}
        {capturedPreview && (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedPreview}
              alt="Captured evidence"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-center">
              <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                <ShieldCheck size={14} /> High-Resolution Field Proof Captured ({Math.round((capturedBlob?.size || 0) / 1024)} KB)
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Shutter & Confirmation Controls */}
      <div className="p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex items-center justify-around z-20">
        
        {!capturedPreview ? (
          /* Live Shutter Button */
          <div className="flex items-center justify-center w-full">
            <button
              onClick={handleSnapPhoto}
              disabled={isInitializing || !!cameraError}
              className="w-20 h-20 rounded-full border-4 border-white p-1.5 flex items-center justify-center active:scale-90 transition-transform shadow-2xl disabled:opacity-40"
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-slate-900 shadow-inner">
                <Camera size={26} />
              </div>
            </button>
          </div>
        ) : (
          /* Retake or Confirm Action Buttons */
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <button
              onClick={handleRetake}
              className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw size={16} /> Retake Photo
            </button>
            <button
              onClick={handleConfirmPhoto}
              className="py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Check size={16} /> Use Photo
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
