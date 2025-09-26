import React, { useState } from 'react';
import { X, Save, Trash2, Play, Pause } from 'lucide-react';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import type { MediaPreview as MediaPreviewType } from '@/types/media';

interface MediaPreviewProps {
  preview: MediaPreviewType;
  onSave: (preview: MediaPreviewType) => Promise<boolean>;
  onDiscard: () => void;
  loading?: boolean;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  preview,
  onSave,
  onDiscard,
  loading = false,
}) => {
  const [saving, setSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await onSave(preview);
      if (success) {
        // Preview will be closed by parent component
      }
    } finally {
      setSaving(false);
    }
  };

  const handleVideoToggle = (video: HTMLVideoElement) => {
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="max-w-4xl max-h-full w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
          <div className="text-white">
            <h3 className="text-lg font-semibold">
              {preview.type === 'image' ? 'Photo Preview' : 'Video Preview'}
            </h3>
            <p className="text-sm text-gray-300">
              {formatFileSize(preview.file.size)} • {preview.file.type}
            </p>
          </div>
          
          <button
            onClick={onDiscard}
            className="w-10 h-10 bg-black bg-opacity-30 rounded-full flex items-center justify-center text-white hover:bg-opacity-50 transition-colors"
            disabled={saving}
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Media Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          {preview.type === 'image' ? (
            <img
              src={preview.url}
              alt="Captured photo"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <div className="relative">
              <video
                src={preview.url}
                className="max-w-full max-h-full object-contain rounded-lg"
                controls={false}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              
              {/* Video Play/Pause Overlay */}
              <button
                onClick={(e) => {
                  const video = e.currentTarget.previousElementSibling as HTMLVideoElement;
                  handleVideoToggle(video);
                }}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-colors rounded-lg"
              >
                {isPlaying ? (
                  <Pause className="w-16 h-16 text-white" />
                ) : (
                  <Play className="w-16 h-16 text-white" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center space-x-4 p-6 bg-black bg-opacity-50">
          <button
            onClick={onDiscard}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            disabled={saving}
          >
            <Trash2 className="w-5 h-5" />
            <span>Discard</span>
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};