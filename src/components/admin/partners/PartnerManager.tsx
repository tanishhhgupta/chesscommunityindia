import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Handshake, 
  Plus, 
  Upload, 
  Search, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FolderOpen,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { sound } from "../../../lib/audio";
import { 
  contentStore, 
  PartnerCollaborator, 
  MediaAsset, 
  resolveMediaUrl 
} from "../../../lib/storage/contentStore";
import { uploadMediaFile } from "../../../lib/media/mediaUploadService";

interface PartnerManagerProps {
  currentUser?: { fullName?: string; email?: string } | null;
  onToast: (msg: string) => void;
}

export const PartnerManager: React.FC<PartnerManagerProps> = ({
  currentUser,
  onToast,
}) => {
  const [partners, setPartners] = useState<PartnerCollaborator[]>(() =>
    contentStore.getPartners(true)
  );
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() =>
    contentStore.getMediaAssets()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerCollaborator | null>(null);
  const [replacingPartner, setReplacingPartner] = useState<PartnerCollaborator | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<PartnerCollaborator | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Form State for Add / Edit
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Platform Partner");
  const [formWebsiteUrl, setFormWebsiteUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLogoUrl, setFormLogoUrl] = useState("");
  const [formEnabled, setFormEnabled] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formUploading, setFormUploading] = useState(false);
  const [formUploadProgress, setFormUploadProgress] = useState(0);

  // File input refs
  const pcFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync with ContentStore
  useEffect(() => {
    const handleSync = () => {
      setPartners(contentStore.getPartners(true));
      setMediaAssets(contentStore.getMediaAssets());
    };

    window.addEventListener("cci-content-synced", handleSync);
    const unsub = contentStore.subscribe(handleSync);
    return () => {
      window.removeEventListener("cci-content-synced", handleSync);
      unsub();
    };
  }, []);

  // Compute active partners for the Live Marquee Preview
  const activePartners = useMemo(() => {
    return partners.filter((p) => p.enabled).sort((a, b) => a.order - b.order);
  }, [partners]);

  // Filtered partners list for admin display
  const filteredPartners = useMemo(() => {
    let result = [...partners].sort((a, b) => a.order - b.order);

    if (selectedCategoryFilter !== "all") {
      result = result.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategoryFilter.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.websiteUrl && p.websiteUrl.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [partners, searchQuery, selectedCategoryFilter]);

  // Categories set for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    partners.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [partners]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleOpenAdd = () => {
    setFormName("");
    setFormCategory("Platform Partner");
    setFormWebsiteUrl("");
    setFormDescription("");
    setFormLogoUrl("");
    setFormEnabled(true);
    setFormError(null);
    setEditingPartner(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (partner: PartnerCollaborator) => {
    setEditingPartner(partner);
    setFormName(partner.name);
    setFormCategory(partner.category || "Institutional Partner");
    setFormWebsiteUrl(partner.websiteUrl === "#" ? "" : partner.websiteUrl || "");
    setFormDescription(partner.description || "");
    setFormLogoUrl(partner.logoUrl);
    setFormEnabled(partner.enabled);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleToggleEnabled = (partner: PartnerCollaborator) => {
    sound.playPieceMove();
    contentStore.togglePartner(partner.id, currentUser?.fullName || "Admin");
    onToast(`${partner.name} is now ${!partner.enabled ? "visible on" : "hidden from"} live marquee.`);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    sound.playTactileClick();
    const sorted = [...partners].sort((a, b) => a.order - b.order);
    const current = sorted[index];
    const prev = sorted[index - 1];
    sorted[index - 1] = current;
    sorted[index] = prev;
    contentStore.reorderPartners(sorted.map((p) => p.id), currentUser?.fullName || "Admin");
    onToast(`Reordered "${current.name}" higher.`);
  };

  const handleMoveDown = (index: number) => {
    const sorted = [...partners].sort((a, b) => a.order - b.order);
    if (index >= sorted.length - 1) return;
    sound.playTactileClick();
    const current = sorted[index];
    const next = sorted[index + 1];
    sorted[index + 1] = current;
    sorted[index] = next;
    contentStore.reorderPartners(sorted.map((p) => p.id), currentUser?.fullName || "Admin");
    onToast(`Reordered "${current.name}" lower.`);
  };

  const handleDeleteConfirm = () => {
    if (!deletingPartner) return;
    sound.playTactileClick();
    contentStore.deletePartner(deletingPartner.id, currentUser?.fullName || "Admin");
    onToast(`Removed partner "${deletingPartner.name}".`);
    setDeletingPartner(null);
  };

  // Direct PC file upload for adding or editing
  const handlePcFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setFormUploading(true);
    setFormError(null);
    setFormUploadProgress(20);

    try {
      const res = await uploadMediaFile(
        file,
        {
          category: "partners",
          altText: `${formName || file.name} Official Logo`,
          actor: currentUser?.fullName || "Admin",
          customName: file.name,
        },
        (pct) => setFormUploadProgress(pct)
      );

      if (res.success && res.asset) {
        setFormLogoUrl(res.asset.url);
        if (!formName) {
          // Derive a clean default name from filename
          const cleanName = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          setFormName(cleanName);
        }
        sound.playGoldenChord();
        onToast(`Uploaded "${file.name}" from your PC!`);
      } else {
        setFormError(res.error || "Failed to upload file from PC.");
      }
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred during PC upload.");
    } finally {
      setFormUploading(false);
      if (pcFileInputRef.current) pcFileInputRef.current.value = "";
    }
  };

  // Direct PC file upload for REPLACING an existing partner's logo
  const handleReplaceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !replacingPartner) return;
    const file = files[0];

    try {
      sound.playTactileClick();
      const res = await uploadMediaFile(
        file,
        {
          category: "partners",
          altText: `${replacingPartner.name} Logo`,
          actor: currentUser?.fullName || "Admin",
          customName: `${replacingPartner.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-logo.${file.name.split('.').pop()}`,
        }
      );

      if (res.success && res.asset) {
        contentStore.savePartner(
          {
            id: replacingPartner.id,
            name: replacingPartner.name,
            logoUrl: res.asset.url,
            slotKey: replacingPartner.slotKey || `partner_${replacingPartner.id}`,
          },
          currentUser?.fullName || "Admin"
        );
        sound.playGoldenChord();
        onToast(`Successfully replaced logo for "${replacingPartner.name}"!`);
        setReplacingPartner(null);
      } else {
        onToast(`Upload failed: ${res.error || "Could not replace logo"}`);
      }
    } catch (err: any) {
      onToast(`Error replacing logo: ${err?.message || "Unknown error"}`);
    } finally {
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  };

  // Submit Add or Edit Partner Form
  const handleSavePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Partner name is required.");
      return;
    }
    if (!formLogoUrl.trim()) {
      setFormError("Please select or upload a partner logo.");
      return;
    }

    sound.playGoldenChord();
    contentStore.savePartner(
      {
        id: editingPartner?.id,
        name: formName.trim(),
        category: formCategory.trim(),
        logoUrl: formLogoUrl.trim(),
        websiteUrl: formWebsiteUrl.trim() || "#",
        description: formDescription.trim(),
        enabled: formEnabled,
      },
      currentUser?.fullName || "Admin"
    );

    onToast(
      editingPartner
        ? `Updated partner "${formName}".`
        : `Added "${formName}" to partners showcase.`
    );
    setIsAddModalOpen(false);
  };

  // Choose from Media Library
  const handleSelectMediaAsset = (asset: MediaAsset) => {
    if (replacingPartner) {
      contentStore.savePartner(
        {
          id: replacingPartner.id,
          name: replacingPartner.name,
          logoUrl: asset.url,
          slotKey: replacingPartner.slotKey || `partner_${replacingPartner.id}`,
        },
        currentUser?.fullName || "Admin"
      );
      sound.playGoldenChord();
      onToast(`Selected "${asset.name}" as logo for "${replacingPartner.name}".`);
      setReplacingPartner(null);
    } else {
      setFormLogoUrl(asset.url);
      if (!formName) {
        setFormName(
          asset.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        );
      }
      sound.playPieceMove();
    }
    setIsMediaPickerOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Hidden file inputs for direct PC upload */}
      <input
        ref={pcFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handlePcFileSelected}
        className="hidden"
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleReplaceFileSelected}
        className="hidden"
      />

      {/* 1. Header with Stats & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FAF7F2] border border-[#D5C4B0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans font-bold text-[#8E5830] tracking-widest uppercase mb-1">
            <Handshake className="w-4 h-4" />
            <span>Homepage Section Manager</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1C1613]">
            Partners & Collaborators Marquee
          </h1>
          <p className="text-xs text-[#7A6E63] mt-1 max-w-xl">
            Manage the continuous left-to-right institutional logo strip displayed between the newsletter and footer. Upload logos directly from your PC or select from the Media Library.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => pcFileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE2D5] border border-[#D5C4B0] text-xs font-semibold text-[#1C1613] transition-colors cursor-pointer shadow-2xs"
            title="Directly select an image file from your computer"
          >
            <Upload className="w-3.5 h-3.5 text-[#8E5830]" />
            <span>Upload from PC</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] active:scale-95 text-xs font-semibold text-[#FAF7F2] transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Partner</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Live Marquee Preview Strip */}
      <div className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#D5C4B0] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8E5830]" />
            <span className="text-xs font-bold text-[#1C1613]">Live Homepage Marquee Preview</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {activePartners.length} Active in Loop
            </span>
          </div>
          <span className="text-[11px] text-[#7A6E63] italic">
            Moves continuously left to right • Pauses on hover
          </span>
        </div>

        {/* The Live Marquee Visual Component */}
        <div className="relative w-full overflow-hidden marquee-container select-none py-2 bg-[#F4EFEA] rounded-2xl border border-[#E3D8CB]">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-[#F4EFEA] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[#F4EFEA] to-transparent" />

          {activePartners.length > 0 ? (
            <div className="marquee-track-ltr flex items-center gap-12 py-2 px-4">
              {[...activePartners, ...activePartners, ...activePartners].map((p, idx) => (
                <div
                  key={`${p.id}-preview-${idx}`}
                  className="shrink-0 flex items-center justify-center"
                  title={`${p.name} • ${p.category}`}
                >
                  <img
                    src={resolveMediaUrl(p.logoUrl, p.slotKey || `partner_${p.id}`)}
                    alt={p.name}
                    className="h-8 max-w-[130px] w-auto object-contain filter grayscale contrast-125 opacity-75 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#7A6E63] italic">
              No active partners. Enable at least one partner below to view the marquee animation.
            </div>
          )}
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6E63]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partners by name, category, or website..."
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

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#7A6E63]">Category:</span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] cursor-pointer"
          >
            <option value="all">All Categories ({partners.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Partner Cards Grid / List */}
      <div className="space-y-3">
        {filteredPartners.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#FAF7F2] border border-dashed border-[#D5C4B0] space-y-3">
            <Handshake className="w-10 h-10 mx-auto text-[#8E5830]/40" />
            <div className="text-sm font-bold text-[#1C1613]">No partners match your criteria</div>
            <div className="text-xs text-[#7A6E63]">
              Try adjusting your search query or upload a new partner logo from your computer.
            </div>
            <button
              onClick={handleOpenAdd}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6B3D22] text-[#FAF7F2] text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Partner</span>
            </button>
          </div>
        ) : (
          filteredPartners.map((partner, index) => {
            const resolvedLogo = resolveMediaUrl(
              partner.logoUrl,
              partner.slotKey || `partner_${partner.id}`
            );

            return (
              <div
                key={partner.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  partner.enabled
                    ? "bg-[#FAF7F2] border-[#D5C4B0] hover:border-[#8E5830]/60 shadow-2xs"
                    : "bg-[#F4EFEA]/60 border-[#E0D7C9] opacity-75"
                }`}
              >
                {/* Left: Reorder Controls + Logo Thumbnail + Details */}
                <div className="flex items-center gap-4 min-w-0">
                  
                  {/* Reorder Buttons */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded-md text-[#7A6E63] hover:text-[#1C1613] hover:bg-[#EAE2D5] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Move up in sequence"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-[#8E5830]">
                      #{partner.order}
                    </span>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === filteredPartners.length - 1}
                      className="p-1 rounded-md text-[#7A6E63] hover:text-[#1C1613] hover:bg-[#EAE2D5] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Move down in sequence"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Logo Thumbnail Container with Replace overlay button */}
                  <div className="relative group w-24 h-16 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] p-2 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={resolvedLogo}
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain filter contrast-125"
                    />
                    <button
                      onClick={() => {
                        setReplacingPartner(partner);
                        replaceFileInputRef.current?.click();
                      }}
                      className="absolute inset-0 bg-[#261811]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[#FAF7F2] text-[10px] font-semibold gap-1 cursor-pointer"
                      title="Directly select new image from PC"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#E6B86A]" />
                      <span>Replace</span>
                    </button>
                  </div>

                  {/* Partner Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#1C1613] truncate">
                        {partner.name}
                      </h4>
                      {partner.category && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EAE2D5] text-[#6B3D22]">
                          {partner.category}
                        </span>
                      )}
                      {!partner.enabled && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-100 text-rose-700">
                          Hidden
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#7A6E63] mt-1">
                      {partner.websiteUrl && partner.websiteUrl !== "#" ? (
                        <a
                          href={partner.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#8E5830] hover:underline truncate max-w-[200px]"
                        >
                          <LinkIcon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{partner.websiteUrl.replace(/^https?:\/\//, "")}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#A39688]">No external URL</span>
                      )}

                      <span className="text-[11px] text-[#A39688] hidden sm:inline">•</span>
                      <span className="text-[11px] text-[#A39688] hidden sm:inline truncate">
                        {partner.description || "Grassroots collaborator"}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  
                  {/* Enable / Disable Toggle */}
                  <button
                    onClick={() => handleToggleEnabled(partner)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      partner.enabled
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
                    }`}
                    title={partner.enabled ? "Currently visible in marquee" : "Currently hidden from marquee"}
                  >
                    {partner.enabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>

                  {/* Replace Logo Action */}
                  <button
                    onClick={() => {
                      setReplacingPartner(partner);
                      replaceFileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4EFEA] hover:bg-[#EAE2D5] border border-[#D5C4B0] text-xs font-medium text-[#1C1613] transition-colors cursor-pointer"
                    title="Replace logo with a file from PC"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#8E5830]" />
                    <span className="hidden md:inline">Replace Logo</span>
                  </button>

                  {/* Edit Details Action */}
                  <button
                    onClick={() => handleOpenEdit(partner)}
                    className="p-2 rounded-xl text-[#7A6E63] hover:text-[#1C1613] hover:bg-[#EAE2D5] transition-colors cursor-pointer"
                    title="Edit Partner Details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete Action */}
                  <button
                    onClick={() => setDeletingPartner(partner)}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Partner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ======================================================================= */}
      {/* ADD / EDIT PARTNER MODAL                                                */}
      {/* ======================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#D5C4B0] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-[#D5C4B0] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1C1613]">
                  {editingPartner ? "Edit Partner & Logo" : "Add Partner & Collaborator"}
                </h3>
                <p className="text-xs text-[#7A6E63] mt-0.5">
                  Directly upload the logo image from your PC or choose an existing one from the library.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-[#7A6E63] hover:text-[#1C1613] hover:bg-[#EAE2D5] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePartnerSubmit} className="p-6 overflow-y-auto space-y-4">
              
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Logo Upload / Selection Area */}
              <div>
                <label className="block text-xs font-bold text-[#594B40] uppercase tracking-wider mb-2">
                  Partner Logo <span className="text-rose-500">*</span>
                </label>

                <div className="p-4 rounded-2xl border-2 border-dashed border-[#D5C4B0] bg-[#F4EFEA] flex flex-col items-center justify-center gap-3 text-center">
                  {formLogoUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-16 w-36 p-2 rounded-xl bg-[#FAF7F2] border border-[#D5C4B0] flex items-center justify-center">
                        <img
                          src={resolveMediaUrl(formLogoUrl)}
                          alt="Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-[#7A6E63] truncate max-w-xs">
                        {formLogoUrl}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <ImageIcon className="w-8 h-8 mx-auto text-[#8E5830]/50" />
                      <div className="text-xs font-semibold text-[#1C1613]">
                        No logo selected yet
                      </div>
                      <div className="text-[11px] text-[#7A6E63]">
                        Upload directly from your computer (JPG, PNG, WEBP, SVG)
                      </div>
                    </div>
                  )}

                  {/* Upload Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => pcFileInputRef.current?.click()}
                      disabled={formUploading}
                      className="px-4 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formUploading ? `Uploading ${formUploadProgress}%...` : "Select Image from PC"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE2D5] border border-[#D5C4B0] text-xs font-medium text-[#1C1613] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#8E5830]" />
                      <span>Media Library</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                  Partner / Institution Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Chess.com, IIITDM Jabalpur, ChessBase India"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] focus:outline-hidden focus:border-[#8E5830]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Platform Partner, Academic Partner, Media Partner, Association"
                  list="partner-categories"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] focus:outline-hidden focus:border-[#8E5830]"
                />
                <datalist id="partner-categories">
                  <option value="Platform Partner" />
                  <option value="Academic Partner" />
                  <option value="Media Partner" />
                  <option value="Sports Association" />
                  <option value="Corporate Sponsor" />
                  <option value="Community Affiliate" />
                </datalist>
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-xs font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                  Website URL
                </label>
                <input
                  type="text"
                  value={formWebsiteUrl}
                  onChange={(e) => setFormWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] focus:outline-hidden focus:border-[#8E5830]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                  Brief Collaboration Context
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short note on partnership or tournament affiliation..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] focus:outline-hidden focus:border-[#8E5830]"
                />
              </div>

              {/* Display in Marquee Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0]">
                <div>
                  <div className="text-xs font-bold text-[#1C1613]">Active in Marquee</div>
                  <div className="text-[11px] text-[#7A6E63]">
                    Immediately display this logo in the continuous homepage strip.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D5C4B0] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8E5830]"></div>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#D5C4B0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5C4B0] text-xs font-semibold text-[#594B40] hover:bg-[#EAE2D5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formUploading}
                  className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {editingPartner ? "Save Changes" : "Add Partner"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MEDIA ASSET PICKER MODAL                                                */}
      {/* ======================================================================= */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#D5C4B0] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-[#D5C4B0] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1C1613]">
                  Select from Media Library
                </h3>
                <p className="text-xs text-[#7A6E63] mt-0.5">
                  Choose a logo already uploaded to the website backend.
                </p>
              </div>
              <button
                onClick={() => setIsMediaPickerOpen(false)}
                className="p-2 rounded-xl text-[#7A6E63] hover:text-[#1C1613] hover:bg-[#EAE2D5] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelectMediaAsset(asset)}
                  className="group p-3 rounded-2xl bg-[#F4EFEA] border border-[#D5C4B0] hover:border-[#8E5830] hover:shadow-md transition-all text-left flex flex-col gap-2 cursor-pointer"
                >
                  <div className="w-full aspect-[4/3] rounded-xl bg-white border border-[#D5C4B0]/60 p-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={resolveMediaUrl(asset.url, asset.slotKey)}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1C1613] truncate">
                      {asset.name}
                    </div>
                    <div className="text-[10px] text-[#7A6E63] uppercase tracking-wider">
                      {asset.category}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-[#D5C4B0] flex items-center justify-between bg-[#F4EFEA]/50">
              <span className="text-xs text-[#7A6E63]">
                {mediaAssets.length} total assets available in library
              </span>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#EAE2D5] text-[#594B40] text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                              */}
      {/* ======================================================================= */}
      {deletingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#D5C4B0] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1C1613]">
                Remove Partner?
              </h3>
            </div>

            <p className="text-xs text-[#594B40] leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-[#1C1613]">"{deletingPartner.name}"</span> from the partners marquee? This will immediately remove their logo from the homepage.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingPartner(null)}
                className="px-4 py-2 rounded-xl border border-[#D5C4B0] text-xs font-semibold text-[#594B40] hover:bg-[#EAE2D5] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PartnerManager;
