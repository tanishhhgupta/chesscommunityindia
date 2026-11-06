import React, { useState } from "react";
import { resolveMediaUrl } from "../../lib/storage/contentStore";
import { 
  ShoppingBag, 
  Sparkles, 
  Eye, 
  Check, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Plus, 
  Minus 
} from "lucide-react";
import { sound } from "../../lib/audio";

interface ProductItem {
  id: string;
  name: string;
  category: "Apparel" | "Tournament Equipment" | "Accessories";
  price: string;
  numericPrice: number;
  description: string;
  material: string;
  imageUrl: string;
  tag: string;
  details: string[];
}

const PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    name: "The Obsidian Tournament Hoodie",
    category: "Apparel",
    price: "₹2,499",
    numericPrice: 2499,
    description: "Heavyweight 450 GSM French Terry cotton in obsidian black. Features embroidered champagne gold CCI knight emblem on chest and 45-tier Elo map on interior lining.",
    material: "100% Organic Heavyweight French Terry (450 GSM)",
    imageUrl: "/images/hero.webp",
    tag: "Signature Edition",
    details: [
      "Custom gold-dipped metal drawstrings",
      "Concealed tournament score-sheet kangaroo pocket",
      "Embroidered 'More Than A Game' on cuffs",
      "Tailored luxury relaxed drop-shoulder cut",
    ],
  },
  {
    id: "prod-2",
    name: "Chaturanga 24k Gold Knight Tee",
    category: "Apparel",
    price: "₹1,299",
    numericPrice: 1299,
    description: "Minimalist luxury tee crafted from 240 GSM combed compact cotton. Subtle metallic gold silk-screened knight on breast with coordinates of Jabalpur birthplace.",
    material: "100% Combed Compact Cotton (240 GSM)",
    imageUrl: "/images/players.webp",
    tag: "Best Seller",
    details: [
      "Silk-screened metallic gold pigment",
      "Ribbed collar that never sags after wash",
      "Coordinates '23.1815° N, 79.9864° E' subtly engraved on neck",
      "Breathable weave designed for intense blitz sessions",
    ],
  },
  {
    id: "prod-3",
    name: "Calacatta Obsidian & Rosewood Handcrafted Set",
    category: "Tournament Equipment",
    price: "₹6,899",
    numericPrice: 6899,
    description: "Official FIDE-regulation weighted tournament chess set. Golden sheesham and ebonized rosewood pieces with triple-weighted brass cores and acoustic felt bases.",
    material: "Ebonized Rosewood & Golden Sheesham with Brass Cores",
    imageUrl: "/images/tournament.webp",
    tag: "Arbiter Guild Grade",
    details: [
      "3.75-inch King height with balanced 42g weight",
      "Includes extra Queens for pawn promotion",
      "Hand-polished matte satin oil finish",
      "Signature velvet-lined walnut wooden carry box with magnetic seal",
    ],
  },
  {
    id: "prod-4",
    name: "The Grandmaster Canvas Field Bag",
    category: "Accessories",
    price: "₹1,799",
    numericPrice: 1799,
    description: "Heavy-duty waterproof 16oz duck canvas tote with dedicated padded sleeves for rollout vinyl board, DGT tournament clock, and arbiter notebook.",
    material: "16oz Waxed Duck Canvas & Full-Grain Leather Straps",
    imageUrl: "/images/group.webp",
    tag: "Limited Batch",
    details: [
      "Padded neoprene shockproof clock compartment",
      "External loops for tournament rollout vinyl board",
      "Heavy brass YKK zippers with antique gold patina",
      "Water-repellent coating for monsoons",
    ],
  },
];

export const MerchandiseShowcase: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [cartModalOpen, setCartModalOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<{ product: ProductItem; quantity: number }[]>([]);
  const [orderConfirmed, setOrderConfirmed] = useState<boolean>(false);

  const handleAddToCart = (product: ProductItem) => {
    sound.playGoldenChord();
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartCount((prev) => prev + 1);
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.product.numericPrice * item.quantity,
    0
  );

  return (
    <section id="merch" className="py-24 relative bg-[#080808] text-[#F5F1E8] border-t border-[rgba(245, 242, 235,0.04)] overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/3 right-1/4 w-[700px] h-[500px] bg-[#C9A45C]/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-[#C9A45C]/30 text-xs font-semibold text-[#E0C895] backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>Official Platform Atelier</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white font-serif-editorial tracking-wide">
              Luxury Materials Meet <br />
              <span className="gold-gradient-text">Chess Heritage.</span>
            </h2>

            <p className="text-[#8D8D8D] text-sm sm:text-base leading-relaxed">
              Crafted in limited drops. Designed for players, arbiters, and masters who live and breathe the game. Every sale directly finances our grassroots school boards fund.
            </p>
          </div>

          {/* Cart Trigger */}
          <button
            onClick={() => {
              sound.playTactileClick();
              setCartModalOpen(true);
            }}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-[#C9A45C]/30 text-white font-bold text-xs sm:text-sm shadow-xl transition-all hover:scale-102 self-start md:self-end"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-[#C9A45C]" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#C9A45C] text-[#080808] text-[9px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span>Atelier Bag ({cartCount})</span>
          </button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="glass-card rounded-3xl overflow-hidden border border-[rgba(245, 242, 235,0.06)] hover:border-[#C9A45C]/40 flex flex-col justify-between transition-all duration-500 group"
            >
              <div>
                {/* Visual Imagery with Zoom & Aspect */}
                <div className="relative h-64 w-full bg-[#121212] overflow-hidden">
                  <img
                    src={resolveMediaUrl(prod.imageUrl)}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80" />

                  {/* Tag Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#C9A45C]/40 text-[#E0C895] text-[10px] font-mono font-bold tracking-wider uppercase">
                    {prod.tag}
                  </div>

                  {/* Quick View Button */}
                  <button
                    onClick={() => {
                      sound.playGlassClick();
                      setSelectedProduct(prod);
                    }}
                    className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-black/80 hover:bg-[#C9A45C] text-white hover:text-black border border-[rgba(245, 242, 235,0.06)] backdrop-blur-md transition-all shadow-lg group-hover:opacity-100 opacity-90"
                    title="Quick Look"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-6 space-y-2">
                  <div className="text-[11px] font-mono text-[#8D8D8D] uppercase tracking-wider">
                    {prod.category}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-[#E0C895] transition-colors leading-snug">
                    {prod.name}
                  </h3>

                  <div className="text-lg font-black text-[#C9A45C] font-mono pt-1">
                    {prod.price}
                  </div>

                  <p className="text-xs text-[#8D8D8D] line-clamp-2 leading-relaxed pt-1">
                    {prod.description}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => handleAddToCart(prod)}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-[#C9A45C] text-white hover:text-[#080808] font-black text-xs border border-[rgba(245, 242, 235,0.06)] hover:border-[#C9A45C] flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Atelier Bag</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick View Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-2xl bg-[#121212] rounded-3xl border border-[#C9A45C]/40 p-6 sm:p-8 space-y-6 shadow-2xl">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid sm:grid-cols-2 gap-6 items-center">
                <div className="relative h-72 rounded-2xl overflow-hidden bg-black/50 border border-[rgba(245, 242, 235,0.06)]">
                  <img
                    src={resolveMediaUrl(selectedProduct.imageUrl)}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-[#C9A45C] uppercase tracking-wider">
                      {selectedProduct.category} &bull; {selectedProduct.tag}
                    </span>
                    <h3 className="text-xl font-bold text-white leading-tight mt-1">
                      {selectedProduct.name}
                    </h3>
                    <div className="text-2xl font-black text-[#C9A45C] font-mono mt-1">
                      {selectedProduct.price}
                    </div>
                  </div>

                  <p className="text-xs text-[#8D8D8D] leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <div className="space-y-1.5 border-t border-[rgba(245, 242, 235,0.04)] pt-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Specifications:</span>
                    {selectedProduct.details.map((d, idx) => (
                      <div key={idx} className="text-xs text-[#F5F1E8] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C] shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="w-full gold-gradient-btn py-3 rounded-xl text-[#080808] font-black text-xs shadow-lg mt-2"
                  >
                    Add to Atelier Bag &bull; {selectedProduct.price}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Atelier Cart Drawer Modal */}
        {cartModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-lg bg-[#121212] rounded-3xl border border-[#C9A45C]/40 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[rgba(245, 242, 235,0.06)] pb-4">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-[#C9A45C]" />
                  <h3 className="text-lg font-bold text-white">Your Atelier Order</h3>
                </div>
                <button
                  onClick={() => setCartModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-[#8D8D8D]">Your bag is currently empty.</p>
                </div>
              ) : !orderConfirmed ? (
                <div className="space-y-4">
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-3.5 rounded-2xl bg-[#181818] border border-[rgba(245, 242, 235,0.04)] flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{item.product.name}</div>
                          <div className="text-[11px] text-[#C9A45C] font-mono font-medium">
                            {item.product.price} &times; {item.quantity}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-white font-mono">
                          ₹{(item.product.numericPrice * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.04)] space-y-2 text-xs">
                    <div className="flex justify-between text-[#8D8D8D]">
                      <span>Subtotal</span>
                      <span className="font-mono text-white">₹{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#8D8D8D]">
                      <span>Pan-India Courier &amp; Insurance</span>
                      <span className="text-emerald-400 font-bold">Complimentary</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-sm border-t border-[rgba(245, 242, 235,0.06)] pt-2">
                      <span>Total Amount</span>
                      <span className="text-[#C9A45C] font-mono">₹{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playGoldenChord();
                      setOrderConfirmed(true);
                      setTimeout(() => {
                        setOrderConfirmed(false);
                        setCartItems([]);
                        setCartCount(0);
                        setCartModalOpen(false);
                      }, 3500);
                    }}
                    className="w-full gold-gradient-btn py-3.5 rounded-xl text-[#080808] font-black text-xs sm:text-sm shadow-xl"
                  >
                    Proceed to Instant UPI Checkout &bull; ₹{cartTotal.toLocaleString()}
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Order Confirmed!</h4>
                  <p className="text-xs text-[#8D8D8D] max-w-xs mx-auto">
                    Thank you for supporting Chess Community India! Your parcel tracking link will be sent to your WhatsApp.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
