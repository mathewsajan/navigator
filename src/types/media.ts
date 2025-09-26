export interface MediaFile {
  id: string;
  property_id: string;
  uploaded_by: string;
  file_name: string;
  file_type: 'image' | 'video';
  mime_type: string;
  file_size: number;
  thumbnail_data: string; // base64 encoded thumbnail
  thumbnail_mime_type: string;
  external_url?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  is_local_only: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaCaptureConfig {
  maxFileSize: number; // in bytes
  supportedImageTypes: string[];
  supportedVideoTypes: string[];
  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailQuality: number;
}

export interface CameraCapabilities {
  hasCamera: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  canRecordVideo: boolean;
  supportedConstraints: MediaTrackSupportedConstraints;
}

export interface CaptureState {
  isCapturing: boolean;
  isRecording: boolean;
  currentMode: 'photo' | 'video';
  facingMode: 'user' | 'environment';
  hasPermission: boolean;
  error: string | null;
}

export interface MediaPreview {
  file: File;
  url: string;
  thumbnail: string;
  type: 'image' | 'video';
}

export interface StorageQuota {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

export interface MediaUploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}