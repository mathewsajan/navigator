import React, { useState } from 'react';
import { Play, Trash2, Download, Eye, Calendar, HardDrive } from 'lucide-react';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import type { MediaFile } from '@/types/media';

interface MediaGalleryProps {
  mediaFiles: MediaFile[];
  onDelete: (mediaId: string) => Promise<boolean>;
  onView: (mediaFile: MediaFile) => void;
  getLocalFileData: (mediaId: string) => string | null;
  loading?: boolean;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  mediaFiles,
  onDelete,
  onView,
  getLocalFileData,
  loading = false,
}) => {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);

  const handleDelete = async (mediaFile: MediaFile) => {
    if (window.confirm('Are you sure you want to delete this media file?')) {
      setDeletingIds(prev => new Set(prev).add(mediaFile.id));
      try {
        await onDelete(mediaFile.id);
      } finally {
        setDeletingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(mediaFile.id);
          return newSet;
        });
      }
    }
  };

  const handleDownload = (mediaFile: MediaFile) => {
    const fileUrl = getLocalFileData(mediaFile.id);
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = mediaFile.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading media files..." />
      </div>
    );
  }

  if (mediaFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HardDrive className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No media files</h3>
        <p className="text-gray-600 max-w-sm mx-auto">
          Start capturing photos and videos to build your property media collection.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaFiles.map((mediaFile) => (
          <div
            key={mediaFile.id}
            className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group"
          >
            {/* Thumbnail */}
            <div className="aspect-video relative">
              <img
                src={mediaFile.thumbnail_data}
                alt={mediaFile.file_name}
                className="w-full h-full object-cover"
              />
              
              {/* Video Play Indicator */}
              {mediaFile.file_type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
              )}

              {/* Sync Status Indicator */}
              <div className="absolute top-2 right-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    mediaFile.sync_status === 'synced'
                      ? 'bg-green-500'
                      : mediaFile.sync_status === 'failed'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}
                  title={`Sync status: ${mediaFile.sync_status}`}
                />
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onView(mediaFile)}
                    className="w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center text-gray-700 hover:bg-opacity-100 transition-colors"
                    aria-label="View media"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleDownload(mediaFile)}
                    className="w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center text-gray-700 hover:bg-opacity-100 transition-colors"
                    aria-label="Download media"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(mediaFile)}
                    className="w-10 h-10 bg-red-500 bg-opacity-90 rounded-full flex items-center justify-center text-white hover:bg-opacity-100 transition-colors"
                    disabled={deletingIds.has(mediaFile.id)}
                    aria-label="Delete media"
                  >
                    {deletingIds.has(mediaFile.id) ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Media Info */}
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                {mediaFile.file_name}
              </h4>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatFileSize(mediaFile.file_size)}</span>
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(mediaFile.created_at)}
                </span>
              </div>
              
              {mediaFile.is_local_only && (
                <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Local only
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-full w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
              <div className="text-white">
                <h3 className="text-lg font-semibold">{selectedMedia.file_name}</h3>
                <p className="text-sm text-gray-300">
                  {formatFileSize(selectedMedia.file_size)} • {formatDate(selectedMedia.created_at)}
                </p>
              </div>
              
              <button
                onClick={() => setSelectedMedia(null)}
                className="w-10 h-10 bg-black bg-opacity-30 rounded-full flex items-center justify-center text-white hover:bg-opacity-50 transition-colors"
                aria-label="Close viewer"
              >
                <Eye className="w-6 h-6" />
              </button>
            </div>

            {/* Media Content */}
            <div className="flex-1 flex items-center justify-center p-4">
              {selectedMedia.file_type === 'image' ? (
                <img
                  src={getLocalFileData(selectedMedia.id) || selectedMedia.thumbnail_data}
                  alt={selectedMedia.file_name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <video
                  src={getLocalFileData(selectedMedia.id) || undefined}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  controls
                  poster={selectedMedia.thumbnail_data}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};