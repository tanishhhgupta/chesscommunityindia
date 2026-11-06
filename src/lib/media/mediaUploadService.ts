import { contentStore, MediaAsset } from '../storage/contentStore';
import { supabase, isSupabaseConfigured } from '../supabase/client';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  formattedSize: string;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Validates file type, size, and extension before upload.
 */
export function validateImageFile(file: File): FileValidationResult {
  const formattedSize = formatBytes(file.size);

  if (!file) {
    return { valid: false, error: 'No file selected.', formattedSize: '0 B' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${formattedSize}) exceeds the 15MB limit. Please choose a smaller image.`,
      formattedSize,
    };
  }

  const name = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasValidMime = ALLOWED_FORMATS.includes(file.type);

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: `Unsupported file format "${file.type || name}". Allowed formats: JPG, PNG, WEBP, and SVG.`,
      formattedSize,
    };
  }

  return { valid: true, formattedSize };
}

/**
 * Reads natural image dimensions in pixels.
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number; formatted: string }> {
  return new Promise((resolve) => {
    // SVGs might not render easily with Image naturalWidth
    if (file.type === 'image/svg+xml') {
      resolve({ width: 1200, height: 800, formatted: 'Scalable Vector (SVG)' });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.naturalWidth || 1280,
        height: img.naturalHeight || 800,
        formatted: `${img.naturalWidth} x ${img.naturalHeight}`,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 1280, height: 800, formatted: '1280 x 800' });
    };

    img.src = objectUrl;
  });
}

/**
 * Reads File into Base64 string with simulated progress tracking.
 */
export function fileToBase64(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 90);
        onProgress(percent);
      }
    };

    reader.onload = () => {
      if (onProgress) onProgress(100);
      resolve(reader.result as string);
    };

    reader.onerror = (err) => {
      reject(new Error(`Failed to read file from PC: ${err}`));
    };

    reader.readAsDataURL(file);
  });
}

export interface UploadOptions {
  category?: MediaAsset['category'];
  altText?: string;
  customName?: string;
  replaceAssetId?: string;
  oldUrl?: string;
  actor?: string;
  assignSlotKey?: string;
}

/**
 * Directly uploads an image file from PC to the website backend storage.
 * Automatically saves or replaces the asset in contentStore and updates referencing pages.
 */
export async function uploadMediaFile(
  file: File,
  options: UploadOptions = {},
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; asset?: MediaAsset; error?: string }> {
  // Step 1: Client-side validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    if (onProgress) onProgress(10);

    // Step 2: Get natural image dimensions
    const dims = await getImageDimensions(file);
    if (onProgress) onProgress(25);

    // Step 3: Convert to base64
    const base64Data = await fileToBase64(file, (p) => {
      if (onProgress) onProgress(25 + Math.round((p * 40) / 100)); // 25 -> 65%
    });

    if (onProgress) onProgress(70);

    const isReplacing = Boolean(options.replaceAssetId);
    const endpoint = isReplacing ? '/api/media/replace' : '/api/media/upload';

    const payload = {
      fileName: options.customName || file.name,
      mimeType: file.type || 'image/jpeg',
      base64: base64Data,
      category: options.category || 'general',
      altText: options.altText || options.customName || file.name,
      dimensions: dims.formatted,
      replaceAssetId: options.replaceAssetId,
      oldUrl: options.oldUrl,
    };

    if (onProgress) onProgress(80);

    // Retrieve active session token
    let authHeader = '';
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cci_player_session_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.sessionToken) {
            authHeader = `Bearer ${parsed.sessionToken}`;
          }
        }
      } catch {}
    }

    // Step 4: Transmit to backend
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (onProgress) onProgress(95);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.asset) {
      throw new Error(data.error || 'Server returned invalid upload response.');
    }

    const serverAsset = data.asset;
    const actor = options.actor || 'Admin';

    let finalAsset: MediaAsset;

    if (isReplacing && options.replaceAssetId) {
      // Step 5A: Replace existing asset record & propagate URLs to cities, events, landing, etc.
      const replaced = contentStore.replaceMediaAsset(
        options.replaceAssetId,
        {
          url: serverAsset.url,
          dimensions: serverAsset.dimensions,
          sizeFormatted: serverAsset.sizeFormatted,
          sizeBytes: serverAsset.sizeBytes,
          mimeType: serverAsset.mimeType,
          // Only update name/altText/category if explicitly customized
          ...(options.customName ? { name: options.customName } : {}),
          ...(options.altText ? { altText: options.altText } : {}),
          ...(options.category ? { category: options.category } : {}),
        },
        actor
      );

      if (!replaced) {
        throw new Error(`Media asset ID "${options.replaceAssetId}" not found for replacement.`);
      }
      finalAsset = replaced;
    } else {
      // Step 5B: Add new asset record to contentStore
      finalAsset = contentStore.addMediaAsset(
        {
          name: options.customName || serverAsset.name,
          url: serverAsset.url,
          dimensions: serverAsset.dimensions,
          sizeFormatted: serverAsset.sizeFormatted,
          sizeBytes: serverAsset.sizeBytes,
          mimeType: serverAsset.mimeType,
          altText: options.altText || serverAsset.altText || options.customName || file.name,
          category: options.category || 'general',
        },
        actor
      );
    }

    if (options.assignSlotKey && finalAsset) {
      contentStore.assignMediaAssetToSection(finalAsset.id, options.assignSlotKey, actor);
    }

    // Mirror uploaded file to Supabase Storage and media_library table
    if (isSupabaseConfigured) {
      const storagePath = `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      supabase.storage
        .from('media')
        .upload(storagePath, file, { upsert: true })
        .then(({ data, error: uploadErr }) => {
          if (!uploadErr && data) {
            const { data: pubData } = supabase.storage.from('media').getPublicUrl(storagePath);
            Promise.resolve(
              supabase.from('media_library').insert({
                title: options.customName || file.name,
                url: pubData?.publicUrl || serverAsset.url,
                storage_path: storagePath,
                section: options.category || 'general',
                mime_type: file.type || 'image/jpeg',
                size_bytes: file.size,
              })
            ).catch(() => {});
          }
        })
        .catch(() => {});
    }

    if (onProgress) onProgress(100);
    return { success: true, asset: finalAsset };
  } catch (err: any) {
    console.error('[MediaUploadService] Upload failed:', err);
    return {
      success: false,
      error: err.message || 'Network error occurred while uploading. Please check connection and retry.',
    };
  }
}

/**
 * Batch upload multiple image files sequentially with progress reporting.
 */
export async function uploadBatchFiles(
  files: File[],
  options: {
    category?: MediaAsset['category'];
    actor?: string;
  } = {},
  onFileProgress?: (fileIndex: number, percent: number) => void,
  onOverallProgress?: (overallPercent: number) => void
): Promise<{ succeeded: MediaAsset[]; failed: { fileName: string; error: string }[] }> {
  const succeeded: MediaAsset[] = [];
  const failed: { fileName: string; error: string }[] = [];

  const total = files.length;
  if (total === 0) return { succeeded, failed };

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const res = await uploadMediaFile(
      file,
      {
        category: options.category || 'general',
        actor: options.actor,
      },
      (p) => {
        if (onFileProgress) onFileProgress(i, p);
        if (onOverallProgress) {
          const overall = Math.round(((i + p / 100) / total) * 100);
          onOverallProgress(overall);
        }
      }
    );

    if (res.success && res.asset) {
      succeeded.push(res.asset);
    } else {
      failed.push({ fileName: file.name, error: res.error || 'Upload failed' });
    }
  }

  if (onOverallProgress) onOverallProgress(100);
  return { succeeded, failed };
}

