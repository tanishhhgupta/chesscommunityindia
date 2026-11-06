import React from 'react';
import { Player } from '../../types';
import { AddPlayerCard } from './AddPlayerCard';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player?: Player | null;
  onSave: (playerData: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  onClose,
  player,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-lg shadow-2xl">
        <AddPlayerCard
          initialPlayer={player}
          totalPlayersCount={1}
          currentIndex={1}
          onSaveAndClose={(data) => {
            onSave(data);
            onClose();
          }}
          onAddNew={(data) => {
            onSave(data);
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};
