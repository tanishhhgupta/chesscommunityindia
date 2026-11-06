import React from "react";
import { 
  X, 
  RefreshCw, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Edit3, 
  Calendar, 
  User, 
  Maximize2, 
  Layers, 
  ShieldCheck 
} from "lucide-react";
import { MediaAsset, contentStore } from "../../../lib/storage/contentStore";

interface MediaPreviewModalProps {
  asset: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onReplace: (asset: MediaAsset) => void;
  onEdit: (asset: MediaAsset) => void;
  onDelete: (asset: MediaAsset) => void;
  onCopyUrl: (url: string) => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  asset,
  isOpen,
  onClose,
  onReplace,
  onEdit,
  onDelete,
  onCopyUrl,
}) => {
  if (!isOpen || !asset) return null;

  const currentUsages = contentStore.getMediaAssetUsage(asset.url, asset.id);

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4">
      <div className="w-full max-w-4xl glass-modal rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE2D5] bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#8E5830]/15 text-[#8E5830] text-[10px] font-mono font-bold uppercase tracking-wider">
              {asset.category}
            </span>
            <h3 className="font-bold text-sm text-[#1C1613] truncate max-w-[320px] sm:max-w-md" title={asset.name}>
              {asset.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onCopyUrl(asset.url)}
              className="p-2 rounded-xl text-[#7A6E63] hover:text-[#8E5830] hover:bg-[#EAE2D5] transition-colors cursor-pointer"
              title="Copy URL"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-[#7A6E63] hover:text-[#8E5830] hover:bg-[#EAE2D5] transition-colors cursor-pointer"
              title="Open full resolution in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#7A6E63] hover:bg-[#EAE2D5] transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Large Image Display & Metadata Panel */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3">
          
          {/* Main Visual Display */}
          <div className="lg:col-span-2 bg-[#1C1613] flex items-center justify-center p-6 min-h-[340px] relative">
            <img
              src={asset.url}
              alt={asset.altText}
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
            />
          </div>

          {/* Metadata & Actions Panel */}
          <div className="p-6 bg-[#FAF7F2] border-t lg:border-t-0 lg:border-l border-[#EAE2D5] flex flex-col justify-between space-y-6">
            
            <div className="space-y-5">
              <div>
                <h4 className="font-serif font-bold text-lg text-[#1C1613] mb-1">
                  Asset Details
                </h4>
                <p className="text-xs text-[#7A6E63]">
                  {asset.altText || "No alternative text specified."}
                </p>
              </div>

              {/* Specs Table */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#EAE2D5]">
                  <span className="text-[#7A6E63] font-medium">Dimensions</span>
                  <span className="font-mono font-bold text-[#1C1613]">
                    {asset.dimensions || "1280 x 800"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#EAE2D5]">
                  <span className="text-[#7A6E63] font-medium">File Size</span>
                  <span className="font-mono font-bold text-[#1C1613]">
                    {asset.sizeFormatted}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#EAE2D5]">
                  <span className="text-[#7A6E63] font-medium">Format</span>
                  <span className="font-mono font-bold text-[#1C1613] uppercase">
                    {asset.mimeType.replace("image/", "")}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#EAE2D5]">
                  <span className="text-[#7A6E63] font-medium">Uploaded</span>
                  <span className="text-[#1C1613]">
                    {new Date(asset.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#EAE2D5]">
                  <span className="text-[#7A6E63] font-medium">Author</span>
                  <span className="text-[#1C1613]">{asset.uploadedBy || "Admin"}</span>
                </div>
              </div>

              {/* Public URL Box */}
              <div>
                <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1">
                  Storage Reference URL
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#FFFFFF] border border-[#D5C4B0] text-[11px] font-mono text-[#594B40] break-all">
                  <span className="flex-1 truncate">{asset.url}</span>
                  <button
                    onClick={() => onCopyUrl(asset.url)}
                    className="p-1 rounded text-[#8E5830] hover:bg-[#F4EFEA] cursor-pointer"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Website Placements */}
              <div>
                <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8E5830]" />
                  <span>Website Usage ({currentUsages.length})</span>
                </label>
                {currentUsages.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                    {currentUsages.map((usage, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#EAE2D5] text-[#594B40] text-[10px] font-medium"
                      >
                        {usage}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#8C7E72] italic">
                    Not currently bound to any active public views.
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-4 border-t border-[#EAE2D5]">
              <button
                onClick={() => {
                  onClose();
                  onReplace(asset);
                }}
                className="w-full py-2.5 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace Image From PC</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onEdit(asset);
                  }}
                  className="py-2 rounded-xl bg-[#FFFFFF] border border-[#D5C4B0] hover:bg-[#EAE2D5] font-semibold text-xs text-[#594B40] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onDelete(asset);
                  }}
                  className="py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 font-semibold text-xs text-rose-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Asset</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

