import React, { useState, useRef } from "react";
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  FolderOpen 
} from "lucide-react";
import { sound } from "../../../lib/audio";
import { MediaAsset, WEBSITE_SECTION_SLOTS, contentStore } from "../../../lib/storage/contentStore";
import { 
  validateImageFile, 
  formatBytes, 
  uploadBatchFiles,
  uploadMediaFile 
} from "../../../lib/media/mediaUploadService";

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  altText: string;
  category: MediaAsset["category"];
  sizeFormatted: string;
  error?: string;
}

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (assets: MediaAsset[]) => void;
  defaultCategory?: MediaAsset["category"];
  actor?: string;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  defaultCategory = "general",
  actor = "Admin",
}) => {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [assignedSlotKey, setAssignedSlotKey] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFilesSelected = (files: FileList | File[]) => {
    setGlobalError(null);
    const newStaged: StagedFile[] = [];

    Array.from(files).forEach((file) => {
      const validation = validateImageFile(file);
      const stagedId = `staged-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const previewUrl = URL.createObjectURL(file);

      newStaged.push({
        id: stagedId,
        file,
        previewUrl,
        name: file.name,
        altText: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        category: defaultCategory,
        sizeFormatted: validation.formattedSize,
        error: validation.valid ? undefined : validation.error,
      });
    });

    setStagedFiles((prev) => [...prev, ...newStaged]);
    sound.playPieceMove();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveStaged = (id: string) => {
    setStagedFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleUpdateStaged = (id: string, updates: Partial<StagedFile>) => {
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleStartUpload = async () => {
    const validFiles = stagedFiles.filter((f) => !f.error);
    if (validFiles.length === 0) {
      setGlobalError("Please select at least one valid image file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setGlobalError(null);

    try {
      const { succeeded, failed } = await uploadBatchFiles(
        validFiles.map((f) => f.file),
        {
          category: defaultCategory,
          actor,
        },
        undefined,
        (overall) => setUploadProgress(overall)
      );

      if (succeeded.length > 0) {
        if (assignedSlotKey && succeeded[0]) {
          contentStore.assignMediaAssetToSection(succeeded[0].id, assignedSlotKey, actor);
        }
        sound.playGoldenChord();
        onUploadSuccess(succeeded);

        // Clean up preview URLs
        stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));

        if (failed.length === 0) {
          onClose();
        } else {
          // Keep only failed files in stage
          setStagedFiles((prev) =>
            prev.filter((f) => failed.some((fail) => fail.fileName === f.name))
          );
          setGlobalError(`${succeeded.length} uploaded successfully. ${failed.length} failed.`);
        }
      } else {
        setGlobalError("Failed to upload selected images. Please check file sizes and formats.");
      }
    } catch (err: any) {
      setGlobalError(err.message || "An error occurred while uploading from your PC.");
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = stagedFiles.filter((f) => !f.error).length;

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4">
      <div className="w-full max-w-3xl glass-modal rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-4">
          <div>
            <h3 className="font-serif font-bold text-xl text-[#1C1613] flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#8E5830]" />
              <span>Direct PC Image Upload</span>
            </h3>
            <p className="text-xs text-[#6B5E52] mt-0.5">
              Select one or multiple images from your computer to store persistently in the Media Gallery.
            </p>
          </div>
          <button
            onClick={() => {
              stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
              onClose();
            }}
            disabled={isUploading}
            className="p-2 rounded-xl text-[#7A6E63] hover:bg-[#EAE2D5] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Alert */}
        {globalError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">{globalError}</div>
          </div>
        )}

        {/* Optional Section Assignment */}
        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#1C1613]">
              Assign to Website Section (Optional)
            </div>
            <div className="text-[11px] text-[#7A6E63]">
              Select a live website slot to immediately replace with this uploaded image.
            </div>
          </div>
          <select
            value={assignedSlotKey}
            onChange={(e) => setAssignedSlotKey(e.target.value)}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] cursor-pointer max-w-xs"
          >
            <option value="">Unassigned (General Library Asset)</option>
            {WEBSITE_SECTION_SLOTS.map((slot) => (
              <option key={slot.slotKey} value={slot.slotKey}>
                {slot.sectionName}
              </option>
            ))}
          </select>
        </div>

        {/* Dropzone & PC File Selector */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-[#8E5830] bg-[#8E5830]/10 scale-[1.01]"
              : "border-[#D5C4B0] hover:border-[#8E5830] bg-[#F4EFEA]/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesSelected(e.target.files);
                e.target.value = ""; // Reset for re-selection
              }
            }}
          />

          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#EAE2D5] flex items-center justify-center text-[#8E5830]">
            <FolderOpen className="w-6 h-6" />
          </div>

          <div className="text-sm font-bold text-[#1C1613]">
            Drag & drop images here, or <span className="text-[#8E5830] underline">browse your PC</span>
          </div>
          <p className="text-xs text-[#7A6E63] mt-1">
            Supports JPG, PNG, WEBP, and safe SVG up to 15MB each.
          </p>
        </div>

        {/* Staged Files Queue */}
        {stagedFiles.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[360px]">
            <div className="flex items-center justify-between text-xs font-bold text-[#594B40] uppercase tracking-wider">
              <span>Selected Images ({stagedFiles.length})</span>
              <button
                type="button"
                onClick={() => {
                  stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
                  setStagedFiles([]);
                }}
                disabled={isUploading}
                className="text-rose-700 hover:underline cursor-pointer disabled:opacity-50"
              >
                Clear all
              </button>
            </div>

            {stagedFiles.map((staged) => (
              <div
                key={staged.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-2xl border transition-all ${
                  staged.error
                    ? "bg-rose-50/60 border-rose-200"
                    : "bg-[#FFFFFF] border-[#EAE2D5]"
                }`}
              >
                <div className="w-16 h-16 rounded-xl bg-[#EAE2D5] overflow-hidden shrink-0 border border-[#D5C4B0]">
                  <img
                    src={staged.previewUrl}
                    alt={staged.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#1C1613] truncate max-w-[240px]">
                      {staged.name}
                    </span>
                    <span className="text-[11px] font-mono text-[#7A6E63]">
                      {staged.sizeFormatted}
                    </span>
                  </div>

                  {staged.error ? (
                    <div className="text-[11px] text-rose-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{staged.error}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <select
                          value={staged.category}
                          disabled={isUploading}
                          onChange={(e) =>
                            handleUpdateStaged(staged.id, {
                              category: e.target.value as MediaAsset["category"],
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                        >
                          <option value="general">General</option>
                          <option value="hero">Hero Banners</option>
                          <option value="cities">City Chapters</option>
                          <option value="events">Tournament Events</option>
                          <option value="about">About & Story</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          disabled={isUploading}
                          value={staged.altText}
                          placeholder="Alt description..."
                          onChange={(e) =>
                            handleUpdateStaged(staged.id, { altText: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => handleRemoveStaged(staged.id)}
                  className="p-1.5 rounded-lg text-[#7A6E63] hover:text-rose-700 hover:bg-rose-50 cursor-pointer disabled:opacity-50 self-end sm:self-center"
                  title="Remove from queue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-1.5 p-3 rounded-xl bg-[#EAE2D5]/50 border border-[#D5C4B0]">
            <div className="flex justify-between text-xs font-semibold text-[#594B40]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8E5830] animate-ping" />
                Uploading images to website storage...
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
          <div className="text-xs text-[#7A6E63]">
            {validCount > 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {validCount} file{validCount > 1 ? "s" : ""} ready for upload
              </span>
            ) : (
              "No files chosen yet"
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-[#D5C4B0] hover:bg-[#EAE2D5] font-semibold text-xs text-[#594B40] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={validCount === 0 || isUploading}
              onClick={handleStartUpload}
              className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>
                {isUploading ? "Uploading..." : `Upload ${validCount} Image${validCount > 1 ? "s" : ""}`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
