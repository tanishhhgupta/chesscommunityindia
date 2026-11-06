import React, { useState, useRef } from "react";
import { 
  X, 
  RefreshCw, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  FolderOpen, 
  ShieldCheck 
} from "lucide-react";
import { sound } from "../../../lib/audio";
import { contentStore, MediaAsset } from "../../../lib/storage/contentStore";
import { 
  validateImageFile, 
  getImageDimensions, 
  uploadMediaFile 
} from "../../../lib/media/mediaUploadService";

interface MediaReplaceModalProps {
  asset: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onReplaceSuccess: (updatedAsset: MediaAsset) => void;
  actor?: string;
}

export const MediaReplaceModal: React.FC<MediaReplaceModalProps> = ({
  asset,
  isOpen,
  onClose,
  onReplaceSuccess,
  actor = "Admin",
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newDimensions, setNewDimensions] = useState<string>("");
  const [keepMetadata, setKeepMetadata] = useState(true);
  const [customTitle, setCustomTitle] = useState("");
  const [customAltText, setCustomAltText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !asset) return null;

  const currentUsages = contentStore.getMediaAssetUsage(asset.url, asset.id);

  const handleFilePicked = async (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Invalid image file.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setCustomTitle(asset.name);
    setCustomAltText(asset.altText);

    const dims = await getImageDimensions(file);
    setNewDimensions(dims.formatted);
    sound.playPieceMove();
  };

  const handleConfirmReplace = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a new replacement image from your computer.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage(null);

    try {
      const res = await uploadMediaFile(
        selectedFile,
        {
          replaceAssetId: asset.id,
          oldUrl: asset.url,
          customName: keepMetadata ? asset.name : customTitle.trim() || selectedFile.name,
          altText: keepMetadata ? asset.altText : customAltText.trim() || asset.altText,
          category: asset.category,
          actor,
        },
        (p) => setUploadProgress(p)
      );

      if (res.success && res.asset) {
        sound.playGoldenChord();
        onReplaceSuccess(res.asset);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to replace image. Please check file format and try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during replacement.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4">
      <div className="w-full max-w-2xl glass-modal rounded-3xl p-6 space-y-5 shadow-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-4">
          <div>
            <h3 className="font-serif font-bold text-xl text-[#1C1613] flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#8E5830]" />
              <span>Replace Image from PC</span>
            </h3>
            <p className="text-xs text-[#6B5E52] mt-0.5">
              Directly replace this image. All website sections using it will update instantly without breaking references.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 rounded-xl text-[#7A6E63] hover:bg-[#EAE2D5] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Content Comparison Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Active Placements Notice */}
          {currentUsages.length > 0 && (
            <div className="p-3 rounded-xl bg-[#EAE2D5]/60 border border-[#D5C4B0] text-xs text-[#594B40] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#8E5830]" />
              <div>
                <span className="font-bold">Active Website Placements ({currentUsages.length}): </span>
                <span>{currentUsages.join(", ")}. </span>
                <span className="text-[#8E5830]">
                  Replacing will instantly reflect across all these locations.
                </span>
              </div>
            </div>
          )}

          {/* Before & After Visual Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Current Asset */}
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#D5C4B0] p-3.5 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A6E63] flex items-center justify-between">
                <span>Current Asset</span>
                <span className="px-1.5 py-0.5 rounded bg-[#F4EFEA] text-[9px] font-mono font-bold text-[#8E5830]">
                  {asset.category}
                </span>
              </div>

              <div className="aspect-[4/3] rounded-xl bg-[#EAE2D5] overflow-hidden border border-[#D5C4B0]">
                <img
                  src={asset.url}
                  alt={asset.altText}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <div className="font-bold text-xs text-[#1C1613] truncate" title={asset.name}>
                  {asset.name}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#7A6E63] font-mono">
                  <span>{asset.dimensions || "1280 x 800"}</span>
                  <span>{asset.sizeFormatted}</span>
                </div>
              </div>
            </div>

            {/* Replacement Asset (From PC) */}
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#D5C4B0] p-3.5 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A6E63] flex items-center justify-between">
                <span>New Image (From PC)</span>
                {selectedFile && (
                  <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                )}
              </div>

              {previewUrl ? (
                <div className="aspect-[4/3] rounded-xl bg-[#EAE2D5] overflow-hidden border border-[#8E5830] relative group">
                  <img
                    src={previewUrl}
                    alt="Replacement Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4" /> Change file
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className="aspect-[4/3] rounded-xl border-2 border-dashed border-[#D5C4B0] hover:border-[#8E5830] bg-[#F4EFEA]/60 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <FolderOpen className="w-8 h-8 text-[#8E5830] mb-2" />
                  <span className="text-xs font-bold text-[#1C1613]">
                    Select file from PC
                  </span>
                  <span className="text-[10px] text-[#7A6E63] mt-0.5">
                    JPG, PNG, WEBP, SVG (max 15MB)
                  </span>
                </div>
              )}

              {selectedFile ? (
                <div className="space-y-1">
                  <div className="font-bold text-xs text-[#1C1613] truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#7A6E63] font-mono">
                    <span>{newDimensions || "Reading..."}</span>
                    <span>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-[#8C7E72] italic text-center py-2">
                  No replacement selected yet
                </div>
              )}
            </div>

          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFilePicked(e.target.files[0]);
                e.target.value = "";
              }
            }}
          />

          {/* Metadata Preservation Option */}
          {selectedFile && (
            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D5] space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1C1613] cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepMetadata}
                  disabled={isUploading}
                  onChange={(e) => setKeepMetadata(e.target.checked)}
                  className="rounded text-[#8E5830] focus:ring-[#8E5830]"
                />
                <span>Preserve existing title, description, and category</span>
              </label>

              {!keepMetadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1">
                      New Title / Name
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      disabled={isUploading}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1">
                      Alt Description
                    </label>
                    <input
                      type="text"
                      value={customAltText}
                      disabled={isUploading}
                      onChange={(e) => setCustomAltText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-1.5 p-3 rounded-xl bg-[#EAE2D5]/50 border border-[#D5C4B0]">
            <div className="flex justify-between text-xs font-semibold text-[#594B40]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8E5830] animate-ping" />
                Uploading replacement image and updating website references...
              </span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#D5C4B0] overflow-hidden">
              <div
                className="h-full bg-[#8E5830] transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#EAE2D5]">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-[#8E5830] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{selectedFile ? "Choose Different Image" : "Browse PC..."}</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-[#D5C4B0] hover:bg-[#EAE2D5] font-semibold text-xs text-[#594B40] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={handleConfirmReplace}
              className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isUploading ? "animate-spin" : ""}`} />
              <span>{isUploading ? "Replacing..." : "Confirm Replacement"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
