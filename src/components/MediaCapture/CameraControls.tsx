import React from 'react';
import { Camera, Video, RotateCcw, X, Circle, Square } from 'lucide-react';
import type { CaptureState } from '@/types/media';

interface CameraControlsProps {
  captureState: CaptureState;
  onCapture: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSwitchCamera: () => void;
  onClose: () => void;
  onModeChange: (mode: 'photo' | 'video') => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  captureState,
  onCapture,
  onStartRecording,
  onStopRecording,
  onSwitchCamera,
  onClose,
  onModeChange,
}) => {
  const handleMainAction = () => {
    if (captureState.currentMode === 'photo') {
      onCapture();
    } else if (captureState.isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-6">
      {/* Mode Selection */}
      <div className="flex justify-center mb-6">
        <div className="bg-black bg-opacity-30 rounded-full p-1 flex">
          <button
            onClick={() => onModeChange('photo')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              captureState.currentMode === 'photo'
                ? 'bg-white text-black'
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
            disabled={captureState.isRecording}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            Photo
          </button>
          <button
            onClick={() => onModeChange('video')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              captureState.currentMode === 'video'
                ? 'bg-white text-black'
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
            disabled={captureState.isRecording}
          >
            <Video className="w-4 h-4 inline mr-2" />
            Video
          </button>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-12 h-12 bg-black bg-opacity-30 rounded-full flex items-center justify-center text-white hover:bg-opacity-50 transition-colors"
          disabled={captureState.isRecording}
          aria-label="Close camera"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Capture/Record Button */}
        <button
          onClick={handleMainAction}
          className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all transform active:scale-95 ${
            captureState.isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-white bg-opacity-20 hover:bg-opacity-30'
          }`}
          aria-label={
            captureState.currentMode === 'photo'
              ? 'Take photo'
              : captureState.isRecording
              ? 'Stop recording'
              : 'Start recording'
          }
        >
          {captureState.currentMode === 'photo' ? (
            <Circle className="w-8 h-8 text-white fill-current" />
          ) : captureState.isRecording ? (
            <Square className="w-6 h-6 text-white fill-current" />
          ) : (
            <Circle className="w-8 h-8 text-red-500 fill-current" />
          )}
        </button>

        {/* Switch Camera Button */}
        <button
          onClick={onSwitchCamera}
          className="w-12 h-12 bg-black bg-opacity-30 rounded-full flex items-center justify-center text-white hover:bg-opacity-50 transition-colors"
          disabled={captureState.isRecording}
          aria-label="Switch camera"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Recording Indicator */}
      {captureState.isRecording && (
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">Recording</span>
        </div>
      )}
    </div>
  );
};