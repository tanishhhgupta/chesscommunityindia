import React from "react";
import { CHESS_AVATARS, ChessAvatar, getChessAvatarById } from "../../lib/chess/avatars";
import { sound } from "../../lib/audio";
import { Check } from "lucide-react";

interface ChessAvatarSelectorProps {
  selectedAvatarId: string;
  onSelectAvatar: (avatarId: string) => void;
  compact?: boolean;
}

export const ChessAvatarSelector: React.FC<ChessAvatarSelectorProps> = ({
  selectedAvatarId,
  onSelectAvatar,
  compact = false,
}) => {
  const currentAvatar = getChessAvatarById(selectedAvatarId);

  return (
    <div className="space-y-3 font-sans">
      {!compact && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#D5C4B0]">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D5C4B0] bg-white shrink-0 p-1 shadow-xs">
            <img
              src={currentAvatar.dataUri}
              alt={currentAvatar.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-xs font-serif font-bold text-[#1C1613] block">
              {currentAvatar.name}
            </span>
            <span className="text-[11px] text-[#594B40] block">
              {currentAvatar.description}
            </span>
          </div>
        </div>
      )}

      {/* Grid of all curated chess avatars */}
      <div className={`grid ${compact ? "grid-cols-4 gap-2" : "grid-cols-2 sm:grid-cols-4 gap-2.5"}`}>
        {CHESS_AVATARS.map((av) => {
          const isSelected = av.id.toLowerCase() === selectedAvatarId.toLowerCase();
          return (
            <button
              key={av.id}
              type="button"
              onClick={() => {
                sound.playTactileClick();
                onSelectAvatar(av.id);
              }}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col items-center justify-center text-center ${
                isSelected
                  ? "bg-[#FAF7F2] border-[#8E5830] ring-2 ring-[#8E5830]/30 shadow-xs"
                  : "bg-white hover:bg-[#FAF7F2] border-[#D5C4B0]"
              }`}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#8E5830] text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}

              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden p-0.5 mb-1.5">
                <img
                  src={av.dataUri}
                  alt={av.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <span className="text-[11px] font-semibold text-[#1C1613] leading-tight">
                {av.name}
              </span>
              {!compact && (
                <span className="text-[9px] text-[#7A6E63] line-clamp-1 mt-0.5">
                  {av.pieceType}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChessAvatarSelector;
