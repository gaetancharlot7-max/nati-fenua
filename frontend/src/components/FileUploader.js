import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImagePlus, Video, X, Camera, Loader2 } from 'lucide-react';
import { uploadApi } from '../lib/api';
import { toast } from 'sonner';

// File Upload Component
export const FileUploader = ({ 
  onUploadComplete, 
  accept = 'image/*,video/*',
  maxSize = 50, // MB
  multiple = false,
  variant = 'default', // 'default' | 'compact' | 'avatar'
  currentUrl = '',
  placeholder = 'Ajouter un média'
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Fichier trop volumineux. Maximum ${maxSize}MB.`);
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await uploadApi.uploadFile(file);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.data.success) {
        onUploadComplete(response.data.url, file.type);
        toast.success('Fichier téléchargé !');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement');
      setPreviewUrl('');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onUploadComplete('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Compact variant (small button)
  if (variant === 'compact') {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          multiple={multiple}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-[#FF6B35]" />
          ) : (
            <ImagePlus size={20} className="text-gray-600" />
          )}
        </button>
      </div>
    );
  }

  // Avatar variant (circular)
  if (variant === 'avatar') {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div 
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden relative group"
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            </>
          ) : (
            <Camera size={32} className="text-gray-400" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-white" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        multiple={multiple}
        className="hidden"
      />

      {/* Preview */}
      {previewUrl ? (
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100">
          {previewUrl.includes('video') || accept.includes('video') ? (
            <video src={previewUrl} className="w-full h-full object-cover" controls />
          ) : (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          )}
          
          {/* Progress overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
              <Loader2 size={40} className="animate-spin text-white mb-2" />
              <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#FF6B35] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-white text-sm mt-2">{progress}%</span>
            </div>
          )}

          {/* Remove button */}
          {!uploading && (
            <button
              onClick={handleRemove}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="py-8 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:from-[#FF5722] hover:to-[#E91E63] text-white flex flex-col items-center gap-2 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={28} className="animate-spin" />
            ) : (
              <ImagePlus size={28} />
            )}
            <span className="text-sm font-medium">
              {uploading ? 'Téléchargement...' : 'Depuis l\'appareil'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const url = prompt('Collez l\'URL de votre image ou vidéo:');
              if (url) {
                setPreviewUrl(url);
                onUploadComplete(url, url.includes('.mp4') ? 'video/mp4' : 'image/jpeg');
              }
            }}
            className="py-8 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#FF6B35] flex flex-col items-center gap-2 transition-all"
          >
            <Upload size={28} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-500">Via URL</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Camera Capture Component (for Live and Stories)
export const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(dataUrl, 'image');
      stopCamera();
    }
  };

  const startRecording = () => {
    if (stream) {
      chunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        onCapture(url, 'video');
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      stopCamera();
    }
  };

  // Start camera on mount
  useState(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="flex-1 object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-6">
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <X size={24} className="text-white" />
        </button>

        <button
          onClick={recording ? stopRecording : takePhoto}
          onLongPress={startRecording}
          className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
            recording ? 'bg-red-500' : 'bg-white/20'
          }`}
        >
          {recording ? (
            <div className="w-8 h-8 rounded bg-white" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white" />
          )}
        </button>

        <button
          onClick={switchCamera}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <Camera size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
