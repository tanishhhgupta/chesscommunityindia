import React from "react";
import { ChessDeskAdmin } from "../admin/ChessDeskAdmin";

interface AdminDeskViewProps {
  onNavigate: (view: string) => void;
}

export const AdminDeskView: React.FC<AdminDeskViewProps> = ({ onNavigate }) => {
  return (
    <div className="relative w-full z-10">
      <ChessDeskAdmin onNavigate={onNavigate} />
    </div>
  );
};
