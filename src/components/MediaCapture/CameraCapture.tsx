import React, { useState, useEffect } from 'react';
import { Camera, CircleAlert as AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { CameraControls } from './CameraControls';
import { MediaPreview } from './MediaPreview';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useMediaCapture } from '@/hooks/useMediaCapture';
import type { MediaPreview as MediaPreviewType, CameraCapabilities } from '@/types/media';

interface CameraCaptureProps {
  propertyId: string;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  propertyId,
  onClose,
}) => {
  const {
    captureState,
    videoRef,
    checkCameraCapabilities,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    startRecording,
    stopRecording,
    saveMediaFile,
    setCaptureMode,
    clearError,
    error
  } = useMediaCapture(propertyId);

  const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);
  const [preview, setPreview] = useState<MediaPreviewType | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check camera capabilities on mount
  useEffect(() => {
    const checkCapabilities = async () => {
      const caps = await checkCameraCapabilities();
      setCapabilities(caps);
      
      if (caps.hasCamera) {
        startCamera();
      }
    };

    checkCapabilities();
  }, [checkCameraCapabilities, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleCapture = async () => {
    const capturedPreview = await capturePhoto();
    if (capturedPreview) {
      setPreview(capturedPreview);
    }
  };

  const handleStartRecording = () => {
    startRecording();
  };

  const handleStopRecording = async () => {
    const recordedPreview = await stopRecording();
    if (recordedPreview) {
      setPreview(recordedPreview);
    }
  };

  const handleSavePreview = async (previewToSave: MediaPreviewType): Promise<boolean> => {
    const success = await saveMediaFile(previewToSave);
    if (success) {
      setPreview(null);
      onClose();
    }
    return success;
  };

  const handleDiscardPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Show preview if available
  if (preview) {
    return (
      <MediaPreview
        preview={preview}
        onSave={handleSavePreview}
        onDiscard={handleDiscardPreview}
      />
    );
  }

  // Show error state
  if (error || (capabilities && !capabilities.hasCamera)) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="max-w-md mx-4 bg-white rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Camera Not Available
          </h3>
          
          <p className="text-gray-600 mb-6">
            {error || 'No camera detected on this device. Please check your camera permissions or try a different device.'}
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={clearError}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!capabilities || !captureState.hasPermission) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg">
            {!capabilities ? 'Checking camera...' : 'Starting camera...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Online/Offline Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          isOnline 
            ? 'bg-green-500 bg-opacity-20 text-green-400' 
            : 'bg-red-500 bg-opacity-20 text-red-400'
        }`}>
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Camera Controls */}
        <CameraControls
          captureState={captureState}
          onCapture={handleCapture}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onSwitchCamera={switchCamera}
          onClose={handleClose}
          onModeChange={setCaptureMode}
        />
      </div>
    </div>
  );
};