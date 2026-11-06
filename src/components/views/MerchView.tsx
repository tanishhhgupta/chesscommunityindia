import React, { useState, useEffect } from "react";
import { sound } from "../../lib/audio";
import { resolveMediaUrl, contentStore } from "../../lib/storage/contentStore";
import { ShoppingBag, Eye, X, Check } from "lucide-react";

interface MerchViewProps {
  onNavigate: (view: string) => void;
}

const PRODUCTS = [
  {
    id: "m-1",
    name: "The Obsidian Tournament Hoodie",
    tag: "Signature Batch",
    price: "₹2,499",
    material: "450 GSM French Terry Cotton &bull; Obsidian Black",
    description: "Tailored luxury drop-shoulder cut featuring an embroidered champagne gold CCI knight emblem on chest and score-sheet kangaroo pocket.",
    imageUrl: "/images/hero.webp",
  },
  {
    id: "m-2",
    name: "Chaturanga 24k Knight Tee",
    tag: "Minimalist Edition",
    price: "₹1,299",
    material: "240 GSM Combed Compact Cotton &bull; Jet Black",
    description: "Metallic gold silk-screened knight on breast with coordinates '23.1815° N, 79.9864° E' of our Jabalpur birthplace engraved on neck.",
    imageUrl: "/images/players.webp",
  },
  {
    id: "m-3",
    name: "Calacatta Obsidian & Rosewood Handcrafted Set",
    tag: "Tournament Grade",
    price: "₹6,899",
    material: "Golden Sheesham & Ebonized Rosewood with Brass Cores",
    description: "Official FIDE-regulation weighted pieces (3.75-inch King, 42g weight) with triple-weighted brass cores and acoustic felt bases.",
    imageUrl: "/images/tournament.webp",
  },
];

export const MerchView: React.FC<MerchViewProps> = ({ onNavigate }) => {
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);
  const [orderNotice, setOrderNotice] = useState(false);
  const [, setContentTimestamp] = useState(Date.now());

  useEffect(() => {
    const sync = () => setContentTimestamp(Date.now());
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);

  const handlePurchase = (p: typeof PRODUCTS[0]) => {
    sound.playGoldenChord();
    setOrderNotice(true);
    setTimeout(() => {
      setOrderNotice(false);
      setSelectedProduct(null);
    }, 3000);
  };

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-6 sm:px-12 max-w-6xl mx-auto space-y-24">
      
      {/* 1. Header */}
      <section className="space-y-4 apple-scroll-reveal">
        <span className="text-xs font-sans tracking-[0.2em] text-[#C5A059] uppercase block font-semibold">
          Merchandise
        </span>
        <h1 className="text-5xl sm:text-7xl font-display font-bold text-[#F5F2EB] tracking-tight leading-[1.05]">
          Wear Your Passion.
        </h1>
        <p className="text-base sm:text-lg text-[#9CA3A8] font-normal max-w-xl font-sans leading-relaxed">
          Chess Community India merchandise for the people who make the community.
        </p>
      </section>

      {/* 2. Large Editorial Products */}
      <section className="grid md:grid-cols-3 gap-8 sm:gap-12 apple-scroll-reveal">
        {PRODUCTS.map((prod) => (
          <div
            key={prod.id}
            className="space-y-6 group cursor-pointer"
            onClick={() => {
              sound.playGlassClick();
              setSelectedProduct(prod);
            }}
          >
            <div className="relative h-96 rounded-2xl overflow-hidden bg-[#0E2126] quiet-card">
              <img
                src={resolveMediaUrl(prod.imageUrl)}
                alt={prod.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-[#C5A059] uppercase tracking-wider">
                {prod.tag}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif-editorial font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  {prod.name}
                </h3>
                <span className="text-sm font-mono font-bold text-white">{prod.price}</span>
              </div>
              <p className="text-xs text-[#9CA3A8] font-light leading-relaxed">
                {prod.description}
              </p>
              <div className="text-[10px] font-mono text-[#C5A059]/80 pt-1">
                {prod.material}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Quick View / Atelier Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay animate-fade-in">
          <div className="relative w-full max-w-md glass-modal-dark rounded-3xl p-8 space-y-6 shadow-2xl">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider">
                {selectedProduct.tag}
              </span>
              <h3 className="text-2xl font-serif-editorial font-bold text-white mt-1">
                {selectedProduct.name}
              </h3>
              <span className="text-xl font-mono font-bold text-white block mt-2">
                {selectedProduct.price}
              </span>
            </div>

            <p className="text-xs text-[#9CA3A8] font-light leading-relaxed">
              {selectedProduct.description}
            </p>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[rgba(245, 242, 235,0.04)] text-[11px] font-mono text-[#9CA3A8]">
              {selectedProduct.material}
            </div>

            {!orderNotice ? (
              <button
                onClick={() => handlePurchase(selectedProduct)}
                className="w-full accent-gold-btn py-3.5 rounded-full text-xs font-mono font-bold text-black shadow-lg"
              >
                Instant UPI Checkout &bull; {selectedProduct.price}
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono text-center flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Order placed! Tracking sent to WhatsApp.</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
