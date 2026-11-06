import React, { useState, useMemo, useRef } from "react";
import { 
  Upload, 
  Search, 
  Filter, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Eye, 
  Edit3, 
  FolderOpen, 
  ExternalLink, 
  Check, 
  Layers, 
  ShieldCheck, 
  ArrowUpDown, 
  X,
  AlertTriangle 
} from "lucide-react";
import { sound } from "../../../lib/audio";
import { contentStore, MediaAsset } from "../../../lib/storage/contentStore";
import { playerAuthStore } from "../../../lib/storage/playerAuthStore";
import { MediaUploadModal } from "./MediaUploadModal";
import { MediaReplaceModal } from "./MediaReplaceModal";
import { MediaPreviewModal } from "./MediaPreviewModal";
import { MediaEditModal } from "./MediaEditModal";

interface MediaGalleryManagerProps {
  currentUser?: { fullName?: string; email?: string; sessionToken?: string } | null;
  onToast: (msg: string) => void;
}

export const MediaGalleryManager: React.FC<MediaGalleryManagerProps> = ({
  currentUser,
  onToast,
}) => {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() =>
    contentStore.getMediaAssets()
  );

  // Sync with content store updates
  React.useEffect(() => {
    const handleSync = () => {
      setMediaAssets(contentStore.getMediaAssets());
    };
    window.addEventListener("cci-content-synced", handleSync);
    const unsub = contentStore.subscribe(handleSync);
    return () => {
      window.removeEventListener("cci-content-synced", handleSync);
      unsub();
    };
  }, []);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "name" | "size">("newest");
  const [isDropActive, setIsDropActive] = useState(false);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [replaceTargetAsset, setReplaceTargetAsset] = useState<MediaAsset | null>(null);
  const [previewTargetAsset, setPreviewTargetAsset] = useState<MediaAsset | null>(null);
  const [editTargetAsset, setEditTargetAsset] = useState<MediaAsset | null>(null);

  // Top dropzone file ref
  const dropzoneInputRef = useRef<HTMLInputElement | null>(null);

  // Filter and sort computation
  const filteredAssets = useMemo(() => {
    let result = [...mediaAssets];

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((a) => a.category === selectedCategory);
    }

    // Section filter
    if (selectedSectionFilter !== "all") {
      if (selectedSectionFilter === "unassigned") {
        result = result.filter((a) => {
          const usages = contentStore.getMediaAssetUsage(a.url, a.id);
          return usages.length === 0 && !a.slotKey;
        });
      } else {
        result = result.filter((a) => {
          const usages = contentStore.getMediaAssetUsage(a.url, a.id).map(u => u.toLowerCase());
          const slot = (a.slotKey || "").toLowerCase();
          const matchKey = selectedSectionFilter.toLowerCase();
          return usages.some(u => u.includes(matchKey)) || slot.includes(matchKey);
        });
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.altText.toLowerCase().includes(q) ||
          a.url.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (a.slotKey && a.slotKey.toLowerCase().includes(q)) ||
          (a.sections && a.sections.some(s => s.toLowerCase().includes(q)))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortOption === "oldest") {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      if (sortOption === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === "size") {
        return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      }
      return 0;
    });

    return result;
  }, [mediaAssets, selectedCategory, selectedSectionFilter, searchQuery, sortOption]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = mediaAssets.length;
    const directUploads = mediaAssets.filter((a) => a.url.startsWith("/uploads/")).length;
    const categoriesCount = new Set(mediaAssets.map((a) => a.category)).size;
    return { totalCount, directUploads, categoriesCount };
  }, [mediaAssets]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    sound.playPieceMove();
    onToast(`Copied storage URL to clipboard!`);
  };

  const handleDeleteAsset = async (asset: MediaAsset) => {
    const usages = contentStore.getMediaAssetUsage(asset.url, asset.id);
    let confirmMessage = `Are you sure you want to delete media asset "${asset.name}"?`;
    if (usages.length > 0) {
      confirmMessage = `⚠️ WARNING: This image is actively in use by ${usages.length} live website section(s):\n- ${usages.join("\n- ")}\n\nDeleting will break image display on those pages. Are you sure you want to proceed?`;
    }

    if (window.confirm(confirmMessage)) {
      contentStore.deleteMediaAsset(asset.id, currentUser?.fullName || "Admin");

      // If stored on server in /uploads/, trigger server deletion
      if (asset.url.startsWith("/uploads/")) {
        try {
          const authHeader = currentUser?.sessionToken ? `Bearer ${currentUser.sessionToken}` : "";
          await fetch("/api/media/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({ url: asset.url }),
          });
        } catch (e) {
          console.warn("Could not delete from server disk:", e);
        }
      }

      sound.playGoldenChord();
      onToast(`Deleted media asset "${asset.name}"`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1C1613] flex items-center gap-2.5">
            <span>Media Gallery & Assets</span>
          </h1>
          <p className="text-xs text-[#6B5E52] mt-0.5">
            Direct PC file uploads, instant image replacement, and centralized website media management.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Upload className="w-4 h-4" />
            <span>Upload From PC</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8E5830]/15 flex items-center justify-center text-[#8E5830]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E63]">Total Media</div>
            <div className="text-xl font-bold text-[#1C1613] font-mono">{stats.totalCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700/15 flex items-center justify-center text-emerald-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E63]">PC Uploads</div>
            <div className="text-xl font-bold text-[#1C1613] font-mono">{stats.directUploads}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 flex items-center justify-center text-[#8E5830]">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E63]">Categories</div>
            <div className="text-xl font-bold text-[#1C1613] font-mono">{stats.categoriesCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAE2D5] flex items-center justify-center text-[#594B40]">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E63]">Auto-Sync</div>
            <div className="text-xs font-bold text-emerald-700">Active Live</div>
          </div>
        </div>
      </div>

      {/* 3. Drop & Quick Upload Banner */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDropActive(true);
        }}
        onDragLeave={() => setIsDropActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDropActive(false);
          setIsUploadModalOpen(true);
        }}
        onClick={() => dropzoneInputRef.current?.click()}
        className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-between gap-4 ${
          isDropActive
            ? "border-[#8E5830] bg-[#8E5830]/10"
            : "border-[#D5C4B0] bg-[#FAF7F2]/80 hover:border-[#8E5830] hover:bg-[#FAF7F2]"
        }`}
      >
        <input
          ref={dropzoneInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={() => setIsUploadModalOpen(true)}
        />
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#EAE2D5] flex items-center justify-center text-[#8E5830] shrink-0">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1C1613]">
              Drag & drop photos directly from your computer here
            </div>
            <div className="text-[11px] text-[#7A6E63]">
              Supports JPG, PNG, WEBP, and safe SVG up to 15MB. Click anywhere to browse your PC.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsUploadModalOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-lg bg-[#EAE2D5] hover:bg-[#D5C4B0] text-[#594B40] text-xs font-semibold cursor-pointer shrink-0 transition-colors"
        >
          Browse Files
        </button>
      </div>

      {/* 4. Toolbar: Search, Category Filter Pills & Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0]">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6E63]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename, title, alt text..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] placeholder-[#7A6E63] focus:outline-hidden focus:border-[#8E5830]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A6E63] hover:text-[#1C1613]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills & Sorting */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          
          {/* Categories */}
          <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#D5C4B0]">
            {[
              { id: "all", label: "All" },
              { id: "partners", label: "Partners" },
              { id: "hero", label: "Hero" },
              { id: "cities", label: "Cities" },
              { id: "events", label: "Events" },
              { id: "about", label: "About" },
              { id: "general", label: "General" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#6B3D22] text-[#FAF7F2] shadow-xs"
                    : "text-[#594B40] hover:bg-[#EAE2D5]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Section Filter Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] cursor-pointer"
            >
              <option value="all">All Website Placements</option>
              <option value="partners">Partners & Marquee</option>
              <option value="homepage">Homepage</option>
              <option value="cities">City Chapters</option>
              <option value="events">Tournament Events</option>
              <option value="about">About Us</option>
              <option value="work">Work & Careers</option>
              <option value="brand">Branding & Logo</option>
              <option value="unassigned">Unassigned Media</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#7A6E63]" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="size">Size (Largest)</option>
            </select>
          </div>

        </div>

      </div>

      {/* 5. Media Grid View */}
      {filteredAssets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#FAF7F2] border border-[#D5C4B0] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EAE2D5] flex items-center justify-center text-[#8E5830]">
            <Search className="w-6 h-6" />
          </div>
          <div className="font-bold text-base text-[#1C1613]">No media assets found</div>
          <p className="text-xs text-[#7A6E63] max-w-sm mx-auto">
            {searchQuery
              ? `No images matched "${searchQuery}". Try clearing your search query.`
              : "No media assets in this category. Upload one directly from your PC!"}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#6B3D22] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => {
            const usages = contentStore.getMediaAssetUsage(asset.url, asset.id);
            return (
              <div
                key={asset.id}
                className="rounded-2xl glass-card overflow-hidden shadow-xs hover:border-[#8E5830] transition-all group flex flex-col justify-between"
              >
                {/* Image Container with Hover Quick Actions */}
                <div className="aspect-[4/3] bg-[#EAE2D5] overflow-hidden relative">
                  <img
                    src={asset.url}
                    alt={asset.altText}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Category Pill */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[9px] font-mono font-bold text-white uppercase backdrop-blur-xs">
                    {asset.category}
                  </div>

                  {/* Active Usage Badge */}
                  {usages.length > 0 && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-800/80 text-[9px] font-bold text-white flex items-center gap-1 backdrop-blur-xs">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>{usages.length} in use</span>
                    </div>
                  )}

                  {/* Floating Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewTargetAsset(asset)}
                      className="p-2 rounded-xl bg-white/90 hover:bg-white text-[#1C1613] shadow-md transition-transform hover:scale-110 cursor-pointer"
                      title="Enlarge & View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplaceTargetAsset(asset)}
                      className="p-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] shadow-md transition-transform hover:scale-110 cursor-pointer"
                      title="Replace this image from PC"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTargetAsset(asset)}
                      className="p-2 rounded-xl bg-white/90 hover:bg-white text-[#1C1613] shadow-md transition-transform hover:scale-110 cursor-pointer"
                      title="Edit metadata & section binding"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Details & Bottom Direct Actions */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div
                      className="font-bold text-xs text-[#1C1613] truncate cursor-pointer hover:text-[#8E5830]"
                      title={asset.name}
                      onClick={() => setPreviewTargetAsset(asset)}
                    >
                      {asset.name}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#7A6E63] font-mono mt-0.5">
                      <span>{asset.dimensions || "1280x800"}</span>
                      <span>{asset.sizeFormatted}</span>
                    </div>

                    {/* Connected Live Section Badge */}
                    <div className="pt-1.5">
                      {usages.length > 0 ? (
                        <div 
                          className="px-2 py-0.5 rounded-md bg-[#8E5830]/10 border border-[#8E5830]/25 text-[10px] font-medium text-[#7D4922] truncate flex items-center gap-1"
                          title={`Used in:\n- ${usages.join('\n- ')}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8E5830] shrink-0" />
                          <span className="truncate">{usages[0]} {usages.length > 1 ? `(+${usages.length - 1})` : ''}</span>
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 rounded-md bg-[#EAE2D5]/50 text-[10px] text-[#8C7E72] italic truncate">
                          Unassigned
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Replace Button */}
                  <div className="pt-2 border-t border-[#EAE2D5] space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setReplaceTargetAsset(asset)}
                      className="w-full py-1.5 rounded-lg bg-[#EAE2D5] hover:bg-[#8E5830] hover:text-[#FAF7F2] text-[#594B40] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Replace Image</span>
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(asset.url)}
                        className="text-[11px] font-semibold text-[#8E5830] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(asset)}
                        className="p-1 rounded text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Modals */}
      {/* Upload Modal */}
      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultCategory={selectedCategory !== "all" ? (selectedCategory as any) : "general"}
        actor={currentUser?.fullName || "Admin"}
        onUploadSuccess={(newAssets) => {
          onToast(`Successfully uploaded ${newAssets.length} image(s) from PC!`);
        }}
      />

      {/* Replace Modal */}
      <MediaReplaceModal
        isOpen={Boolean(replaceTargetAsset)}
        asset={replaceTargetAsset}
        actor={currentUser?.fullName || "Admin"}
        onClose={() => setReplaceTargetAsset(null)}
        onReplaceSuccess={(updated) => {
          onToast(`Successfully replaced "${updated.name}" across all website sections!`);
        }}
      />

      {/* Preview Modal */}
      <MediaPreviewModal
        isOpen={Boolean(previewTargetAsset)}
        asset={previewTargetAsset}
        onClose={() => setPreviewTargetAsset(null)}
        onCopyUrl={handleCopyUrl}
        onReplace={(asset) => setReplaceTargetAsset(asset)}
        onEdit={(asset) => setEditTargetAsset(asset)}
        onDelete={(asset) => handleDeleteAsset(asset)}
      />

      {/* Edit Metadata Modal */}
      <MediaEditModal
        isOpen={Boolean(editTargetAsset)}
        asset={editTargetAsset}
        onClose={() => setEditTargetAsset(null)}
        onSave={(id, updates) => {
          contentStore.updateMediaAsset(id, updates, currentUser?.fullName || "Admin");
          onToast("Media details updated successfully!");
        }}
      />

    </div>
  );
};
