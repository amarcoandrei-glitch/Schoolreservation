import { useRef, useState } from 'react';
import { ImageIcon, Upload, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  validateImageFile,
  uploadToCloudinary,
  optimizeImageUrl,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE_MB,
} from '../../../lib/cloudinary';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUploadingChange,
  label = 'Equipment Image',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const currentImage = preview ?? value ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);
    setUploaded(false);

    // Validate
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }

    // Local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Upload to Cloudinary
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const result = await uploadToCloudinary(file);
      onChange(result.secure_url);
      setUploaded(true);
    } catch (err: any) {
      setError(err.message ?? 'Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    setUploaded(false);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[--foreground] mb-1.5">{label}</label>

      {/* Drop zone / preview */}
      <div
        className={`relative rounded-xl border-2 overflow-hidden transition-all ${
          currentImage
            ? 'border-[--border]'
            : 'border-dashed border-[--border] hover:border-blue-400 cursor-pointer'
        }`}
        style={{ minHeight: 160 }}
        onClick={() => !currentImage && inputRef.current?.click()}
      >
        {currentImage ? (
          <>
            {/* Image preview */}
            <img
              src={preview ? currentImage : optimizeImageUrl(currentImage, 600, 85)}
              alt="Equipment preview"
              className="w-full object-cover"
              style={{ maxHeight: 220 }}
            />

            {/* Overlay controls */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg text-sm font-medium text-[--foreground] shadow hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Change
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 rounded-lg text-sm font-medium text-white shadow hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            </div>

            {/* Status badge */}
            {uploading ? (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 rounded-full text-white text-xs font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                Uploading…
              </div>
            ) : uploaded ? (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 rounded-full text-white text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                Uploaded
              </div>
            ) : null}
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            {uploading ? (
              <>
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-[--foreground]">Uploading to Cloudinary…</p>
                <p className="text-xs text-[--muted-foreground] mt-1">Please wait</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <ImageIcon className="w-7 h-7 text-blue-500" />
                </div>
                <p className="text-sm font-medium text-[--foreground] mb-1">
                  Click to upload image
                </p>
                <p className="text-xs text-[--muted-foreground]">
                  JPG, JPEG, PNG, WEBP · max {MAX_FILE_SIZE_MB}MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
