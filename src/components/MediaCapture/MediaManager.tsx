import React, { useState } from 'react';
import { Camera, Upload, HardDrive, Trash2, RefreshCw } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { MediaGallery } from './MediaGallery';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useMediaCapture } from '@/hooks/useMediaCapture';
import { generateThumbnail, validateMediaFile } from '@/utils/thumbnailGenerator';

interface MediaManagerProps {
  propertyId: string;
  propertyAddress: string;
}

const MEDIA_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  supportedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
};

export const MediaManager: React.FC<MediaManagerProps> = ({
  propertyId,
  propertyAddress,
}) => {
  const {
    mediaFiles,
    loading,
    error,
    storageQuota,
    deleteMediaFile,
    loadMediaFiles,
    saveMediaFile,
    getLocalFileData,
    clearError
  } = useMediaCapture(propertyId);

  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    clearError();

    try {
      const fileArray = Array.from(files);
      const validFiles = [];

      // Validate all files first
      for (const file of fileArray) {
        const validation = validateMediaFile(file, {
          maxSize: MEDIA_CONFIG.maxFileSize,
          supportedTypes: [
            ...MEDIA_CONFIG.supportedImageTypes,
            ...MEDIA_CONFIG.supportedVideoTypes
          ]
        });

        if (validation.isValid) {
          validFiles.push(file);
        } else {
          console.warn(`Skipping ${file.name}: ${validation.error}`);
        }
      }

      // Process valid files
      for (const file of validFiles) {
        try {
          const thumbnail = await generateThumbnail(file);
          const url = URL.createObjectURL(file);

          const preview = {
            file,
            url,
            thumbnail,
            type: file.type.startsWith('image/') ? 'image' as const : 'video' as const
          };

          await saveMediaFile(preview);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewMedia = (mediaFile: any) => {
    // This could open a detailed view modal
    console.log('View media:', mediaFile);
  };

  if (showCamera) {
    return (
      <CameraCapture
        propertyId={propertyId}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Property Media</h2>
          <p className="text-sm text-gray-600">{propertyAddress}</p>
        </div>
        
        <button
          onClick={loadMediaFiles}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
          aria-label="Refresh media files"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Storage Quota */}
      {storageQuota.total > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Storage Usage</span>
            <span className="text-sm text-gray-600">
              {formatStorageSize(storageQuota.used)} / {formatStorageSize(storageQuota.total)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                storageQuota.percentage > 90
                  ? 'bg-red-500'
                  : storageQuota.percentage > 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(storageQuota.percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setShowCamera(true)}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
        >
          <Camera className="w-5 h-5" />
          <span>Take Photo/Video</span>
        </button>
        
        <label className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
          <Upload className="w-5 h-5" />
          <span>{uploading ? 'Uploading...' : 'Upload Files'}</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={clearError}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
      >
        <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          Drag and drop media files here, or use the buttons above
        </p>
        <p className="text-sm text-gray-500">
          Supports JPEG, PNG, WebP images and MP4, WebM videos up to 50MB
        </p>
      </div>

      {/* Media Gallery */}
      <MediaGallery
        mediaFiles={mediaFiles}
        onDelete={deleteMediaFile}
        onView={handleViewMedia}
        getLocalFileData={getLocalFileData}
        loading={loading}
      />

      {/* Loading Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-700">Processing media files...</p>
          </div>
        </div>
      )}
    </div>
  );
};