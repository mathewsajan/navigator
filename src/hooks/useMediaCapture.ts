import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { generateThumbnail, validateMediaFile, getStorageQuota } from '@/utils/thumbnailGenerator';
import type { 
  MediaFile, 
  CameraCapabilities, 
  CaptureState, 
  MediaPreview,
  StorageQuota,
  MediaUploadProgress
} from '@/types/media';

const MEDIA_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  supportedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  thumbnailWidth: 300,
  thumbnailHeight: 200,
  thumbnailQuality: 0.8
};

export const useMediaCapture = (propertyId: string) => {
  const { user } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureState, setCaptureState] = useState<CaptureState>({
    isCapturing: false,
    isRecording: false,
    currentMode: 'photo',
    facingMode: 'environment',
    hasPermission: false,
    error: null
  });
  const [storageQuota, setStorageQuota] = useState<StorageQuota>({
    used: 0,
    available: 0,
    total: 0,
    percentage: 0
  });
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  /**
   * Check camera capabilities
   */
  const checkCameraCapabilities = useCallback(async (): Promise<CameraCapabilities> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
      
      return {
        hasCamera: videoDevices.length > 0,
        hasFrontCamera: videoDevices.some(device => 
          device.label.toLowerCase().includes('front') || 
          device.label.toLowerCase().includes('user')
        ),
        hasBackCamera: videoDevices.some(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        ),
        canRecordVideo: 'MediaRecorder' in window,
        supportedConstraints
      };
    } catch (error) {
      console.error('Error checking camera capabilities:', error);
      return {
        hasCamera: false,
        hasFrontCamera: false,
        hasBackCamera: false,
        canRecordVideo: false,
        supportedConstraints: {}
      };
    }
  }, []);

  /**
   * Request camera permission and start stream
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setCaptureState(prev => ({ ...prev, error: null }));

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: captureState.facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: captureState.currentMode === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCaptureState(prev => ({
        ...prev,
        hasPermission: true,
        isCapturing: true
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera access denied';
      setError(errorMessage);
      setCaptureState(prev => ({
        ...prev,
        error: errorMessage,
        hasPermission: false
      }));
    }
  }, [captureState.facingMode, captureState.currentMode]);

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCaptureState(prev => ({
      ...prev,
      isCapturing: false,
      isRecording: false
    }));
  }, []);

  /**
   * Switch camera (front/back)
   */
  const switchCamera = useCallback(async () => {
    const newFacingMode = captureState.facingMode === 'user' ? 'environment' : 'user';
    setCaptureState(prev => ({ ...prev, facingMode: newFacingMode }));
    
    if (captureState.isCapturing) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  }, [captureState.facingMode, captureState.isCapturing, startCamera, stopCamera]);

  /**
   * Capture photo
   */
  const capturePhoto = useCallback(async (): Promise<MediaPreview | null> => {
    if (!videoRef.current || !streamRef.current) {
      setError('Camera not available');
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0);

      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setError('Failed to capture photo');
            resolve(null);
            return;
          }

          const file = new File([blob], `photo_${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          try {
            const thumbnail = await generateThumbnail(file);
            const url = URL.createObjectURL(file);

            resolve({
              file,
              url,
              thumbnail,
              type: 'image'
            });
          } catch (error) {
            setError('Failed to generate thumbnail');
            resolve(null);
          }
        }, 'image/jpeg', 0.9);
      });
    } catch (error) {
      setError('Failed to capture photo');
      return null;
    }
  }, []);

  /**
   * Start video recording
   */
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError('Camera not available');
      return;
    }

    try {
      recordedChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setCaptureState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      setError('Failed to start recording');
    }
  }, []);

  /**
   * Stop video recording
   */
  const stopRecording = useCallback(async (): Promise<MediaPreview | null> => {
    if (!mediaRecorderRef.current) {
      return null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(recordedChunksRef.current, {
            type: 'video/webm'
          });

          const file = new File([blob], `video_${Date.now()}.webm`, {
            type: 'video/webm',
            lastModified: Date.now()
          });

          const thumbnail = await generateThumbnail(file);
          const url = URL.createObjectURL(file);

          resolve({
            file,
            url,
            thumbnail,
            type: 'video'
          });
        } catch (error) {
          setError('Failed to process recording');
          resolve(null);
        }
      };

      mediaRecorder.stop();
      setCaptureState(prev => ({ ...prev, isRecording: false }));
    });
  }, []);

  /**
   * Save media file
   */
  const saveMediaFile = useCallback(async (preview: MediaPreview): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setLoading(true);
      
      // Validate file
      const validation = validateMediaFile(preview.file, {
        maxSize: MEDIA_CONFIG.maxFileSize,
        supportedTypes: [
          ...MEDIA_CONFIG.supportedImageTypes,
          ...MEDIA_CONFIG.supportedVideoTypes
        ]
      });

      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return false;
      }

      // Create media file record
      const mediaFile: Omit<MediaFile, 'id' | 'created_at' | 'updated_at'> = {
        property_id: propertyId,
        uploaded_by: user.id,
        file_name: preview.file.name,
        file_type: preview.type,
        mime_type: preview.file.type,
        file_size: preview.file.size,
        thumbnail_data: preview.thumbnail,
        thumbnail_mime_type: 'image/jpeg',
        sync_status: 'pending',
        is_local_only: true
      };

      // Save to Supabase
      const { data, error: dbError } = await supabase
        .from('property_media')
        .insert([mediaFile])
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Store full file in local storage
      const fileKey = `media_${data.id}`;
      const fileData = await preview.file.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileData)));
      
      localStorage.setItem(fileKey, JSON.stringify({
        data: base64Data,
        type: preview.file.type,
        name: preview.file.name
      }));

      // Update local state
      setMediaFiles(prev => [...prev, data]);
      
      // Update storage quota
      const quota = await getStorageQuota();
      setStorageQuota(quota);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save media';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, propertyId]);

  /**
   * Delete media file
   */
  const deleteMediaFile = useCallback(async (mediaId: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Delete from Supabase
      const { error: dbError } = await supabase
        .from('property_media')
        .delete()
        .eq('id', mediaId);

      if (dbError) {
        throw dbError;
      }

      // Remove from local storage
      const fileKey = `media_${mediaId}`;
      localStorage.removeItem(fileKey);

      // Update local state
      setMediaFiles(prev => prev.filter(file => file.id !== mediaId));

      // Update storage quota
      const quota = await getStorageQuota();
      setStorageQuota(quota);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete media';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load media files for property
   */
  const loadMediaFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('property_media')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (dbError) {
        throw dbError;
      }

      setMediaFiles(data || []);

      // Update storage quota
      const quota = await getStorageQuota();
      setStorageQuota(quota);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load media files';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  /**
   * Get local file data
   */
  const getLocalFileData = useCallback((mediaId: string): string | null => {
    try {
      const fileKey = `media_${mediaId}`;
      const storedData = localStorage.getItem(fileKey);
      
      if (!storedData) {
        return null;
      }

      const { data, type } = JSON.parse(storedData);
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to get local file data:', error);
      return null;
    }
  }, []);

  // Load media files on mount
  useEffect(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    // State
    mediaFiles,
    loading,
    error,
    captureState,
    storageQuota,
    uploadProgress,
    
    // Refs
    videoRef,
    
    // Methods
    checkCameraCapabilities,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    startRecording,
    stopRecording,
    saveMediaFile,
    deleteMediaFile,
    loadMediaFiles,
    getLocalFileData,
    
    // Utilities
    clearError: () => setError(null),
    setCaptureMode: (mode: 'photo' | 'video') => 
      setCaptureState(prev => ({ ...prev, currentMode: mode }))
  };
};