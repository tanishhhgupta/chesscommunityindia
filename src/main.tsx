import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { ChessPairSyncBridge } from "./chesspair/lib/syncBridge";

// Initialize ChessPair <-> ChessManager real-time synchronization bridge
ChessPairSyncBridge.init();

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
