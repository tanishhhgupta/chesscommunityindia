import React, { useState, useEffect } from "react";
import { X, Save, Edit3 } from "lucide-react";
import { sound } from "../../../lib/audio";
import { MediaAsset, WEBSITE_SECTION_SLOTS, contentStore } from "../../../lib/storage/contentStore";

interface MediaEditModalProps {
  asset: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<MediaAsset>) => void;
}

export const MediaEditModal: React.FC<MediaEditModalProps> = ({
  asset,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState<MediaAsset["category"]>("general");
  const [slotKey, setSlotKey] = useState<string>("");

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setAltText(asset.altText);
      setCategory(asset.category);
      setSlotKey(asset.slotKey || "");
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.playGoldenChord();
    onSave(asset.id, {
      name: name.trim(),
      altText: altText.trim() || name.trim(),
      category,
      slotKey: slotKey || undefined,
    });

    if (slotKey) {
      contentStore.assignMediaAssetToSection(asset.id, slotKey);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-modal rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#8E5830]" />
            <h3 className="font-serif font-bold text-lg text-[#1C1613]">
              Edit Media Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7A6E63] hover:bg-[#EAE2D5] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail preview */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D5]">
          <div className="w-14 h-14 rounded-xl bg-[#EAE2D5] overflow-hidden border border-[#D5C4B0] shrink-0">
            <img src={asset.url} alt={asset.altText} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-[#1C1613] truncate">{asset.name}</div>
            <div className="text-[10px] font-mono text-[#7A6E63]">{asset.sizeFormatted} • {asset.dimensions}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">
              Title / File Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613] font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
            >
              <option value="general">General</option>
              <option value="hero">Hero Banners</option>
              <option value="cities">City Chapters</option>
              <option value="events">Tournament Events</option>
              <option value="about">About & Story</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">
              Website Section Placement
            </label>
            <select
              value={slotKey}
              onChange={(e) => setSlotKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
            >
              <option value="">Unassigned (General Library Asset)</option>
              {WEBSITE_SECTION_SLOTS.map((slot) => (
                <option key={slot.slotKey} value={slot.slotKey}>
                  {slot.sectionName}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#7A6E63] mt-1">
              Assigning this image will immediately update that section across the live website.
            </p>
          </div>

          <div>
            <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">
              Alt Description
            </label>
            <textarea
              rows={2}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Descriptive text for accessibility..."
              className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE2D5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D5C4B0] hover:bg-[#EAE2D5] font-semibold text-[#594B40] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

