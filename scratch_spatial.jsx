import React, { useState, useRef } from 'react';
import { Upload, X, Camera, Send, FileImage, Loader2, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function FieldVerificationWorkspace({ task, activityId, onClose, onVerified }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 10MB.');
      return;
    }

    setImage(file);
    setError('');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!image) {
      setError('Please select an evidence photo to submit.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description of the completed work.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('description', description);
      formData.append('activityId', activityId);

      const token = localStorage.getItem('sanchalan_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/tasks/${task.taskId}/evidence`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit evidence.');
      }

      setSuccess(true);
      setTimeout(() => {
        onVerified();
      }, 2000);
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
        <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
        <h3 className="text-2xl font-black text-emerald-800 mb-2">Evidence Submitted Successfully</h3>
        <p className="text-emerald-600 font-medium max-w-md">Your evidence has been transmitted to the Site Engineer for verification. This activity is now pending approval.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[var(--border-subtle)] rounded-xl shadow-lg overflow-hidden flex flex-col mt-4">
      <div className="bg-[var(--bg-surface-2)] px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-[var(--text-primary)]">Submit Evidence</h3>
          <p className="text-xs text-[var(--text-secondary)] font-medium">Capture current progress for verification.</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Area: Photo Upload */}
          <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Evidence Photo</label>
            <p className="text-xs text-gray-500 mb-4">Upload a clear photo containing a visible timestamp. The photo must be taken within the last 2 hours.</p>
            
            <div className="flex-1 min-h-[300px] relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center overflow-hidden hover:bg-gray-100 hover:border-indigo-300 transition-colors cursor-pointer group" onClick={() => !preview && fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />
              
              {preview ? (
                <>
                  <img src={preview} alt="Evidence preview" className="absolute inset-0 w-full h-full object-contain bg-black/5" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                      className="px-4 py-2 bg-white/90 text-red-600 rounded-lg font-bold text-sm hover:bg-white shadow-lg flex items-center gap-2"
                    >
                      <X size={16} /> Remove Image
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 pointer-events-none">
                  <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500 group-hover:scale-110 transition-transform">
                    <Camera size={28} />
                  </div>
                  <h4 className="text-gray-700 font-bold mb-1">Tap to select photo</h4>
                  <p className="text-gray-400 text-xs">JPG, PNG, WEBP (Max 10MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Area: Description & Submit */}
          <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Evidence Description</label>
            <p className="text-xs text-gray-500 mb-4">Describe the completed work, measurements taken, and any issues encountered.</p>
            
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Excavation of Area A completed to a depth of 2 meters. Soil was stable. Ready for next phase."
              className="flex-1 w-full min-h-[200px] p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none outline-none transition-all shadow-inner text-gray-700 leading-relaxed"
            ></textarea>
            
            <div className="mt-6 flex gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                disabled={loading}
                className="px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send size={20} /> SUBMIT EVIDENCE
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2 text-xs text-blue-800">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <p>Your submission will be timestamped and geolocated. Ensure the image clearly shows the work completed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
