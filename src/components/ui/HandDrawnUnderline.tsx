import React from "react";

export type CurveVariant = "arch" | "swash" | "double" | "loop";

export interface HandDrawnUnderlineProps {
  children: React.ReactNode;
  variant?: CurveVariant;
  color?: string;
  className?: string;
  underlineClassName?: string;
  strokeWidth?: number | string;
  animate?: boolean;
  delay?: number;
}

/**
 * HandDrawnUnderline
 * Bespoke organic SVG vector underline designed specifically to harmonize
 * with the vintage swashes and baselines of the "Briston" typeface.
 * 
 * Supports 4 Vector Specifications from the Official Editorial Guide:
 * - Curve A (arch): The Vintage Arch Underline ('a Game.', 'grow', 'Together')
 * - Curve B (swash): The Calligraphic S-Swash ('Revolution', 'Champions', 'Grand Sovereign')
 * - Curve C (double): The Double-Stroke Sketch Underline ('Your Move.', '10,000+ Players')
 * - Curve D (loop): The Organic Hand-Drawn Loop Callout ('FREE', 'LIVE', 'NEW', 'INDIA')
 */
export const HandDrawnUnderline: React.FC<HandDrawnUnderlineProps> = ({
  children,
  variant = "arch",
  color = "#C5A059",
  className = "",
  underlineClassName = "",
  strokeWidth,
  animate = true,
  delay = 150,
}) => {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}

      {/* Curve A: The Vintage Arch Underline (Gentle sag in the middle, soft upward flick at ends) */}
      {variant === "arch" && (
        <svg
          viewBox="0 0 220 24"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
          className={`absolute -bottom-2.5 left-0 w-full h-3 sm:h-3.5 overflow-visible pointer-events-none ${underlineClassName}`}
        >
          <path
            d="M 4 14 C 45 22, 115 23, 165 14 C 185 10, 205 13, 220 16"
            stroke={color}
            strokeWidth={strokeWidth ?? "3.2"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animate ? "hand-drawn-stroke" : ""}
            style={animate && delay ? { animationDelay: `${delay}ms` } : undefined}
          />
        </svg>
      )}

      {/* Curve B: The Calligraphic S-Swash (Subtle wave mimicking fountain pen) */}
      {variant === "swash" && (
        <svg
          viewBox="0 0 225 24"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
          className={`absolute -bottom-2.5 left-0 w-full h-3 sm:h-3.5 overflow-visible pointer-events-none ${underlineClassName}`}
        >
          <path
            d="M 2 12 C 30 4, 80 20, 130 18 C 170 16, 200 8, 225 14"
            stroke={color}
            strokeWidth={strokeWidth ?? "2.8"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animate ? "hand-drawn-stroke" : ""}
            style={animate && delay ? { animationDelay: `${delay}ms` } : undefined}
          />
        </svg>
      )}

      {/* Curve C: The Double-Stroke Sketch Underline (Dual layered paths with vertical offset) */}
      {variant === "double" && (
        <svg
          viewBox="0 0 225 28"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
          className={`absolute -bottom-3 left-0 w-full h-3.5 sm:h-4 overflow-visible pointer-events-none ${underlineClassName}`}
        >
          <path
            d="M 4 11 C 45 18, 115 19, 165 11 C 185 8, 205 11, 220 13"
            stroke={color}
            strokeWidth={strokeWidth ?? "2.2"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animate ? "hand-drawn-stroke" : ""}
            style={animate && delay ? { animationDelay: `${delay}ms` } : undefined}
          />
          <path
            d="M 6 15 C 48 23, 118 24, 168 15 C 187 13, 203 16, 218 18"
            stroke={color === "#C5A059" || color === "#C5A059" ? "#E0C895" : color}
            strokeWidth={typeof strokeWidth === "number" ? strokeWidth * 0.7 : "1.6"}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
            className={animate ? "hand-drawn-stroke" : ""}
            style={animate && delay ? { animationDelay: `${delay + 80}ms` } : undefined}
          />
        </svg>
      )}

      {/* Curve D: The Organic Hand-Drawn Loop (Imperfect hand-drawn oval encircling a word) */}
      {variant === "loop" && (
        <svg
          viewBox="0 0 100 32"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
          className={`absolute -inset-x-2.5 -inset-y-1.5 w-[calc(100%+20px)] h-[calc(100%+12px)] overflow-visible pointer-events-none ${underlineClassName}`}
        >
          <path
            d="M 10 16 C 8 4, 60 4, 90 8 C 98 16, 92 26, 50 28 C 10 29, 6 20, 12 14"
            stroke={color}
            strokeWidth={strokeWidth ?? "2.2"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animate ? "hand-drawn-stroke" : ""}
            style={animate && delay ? { animationDelay: `${delay}ms` } : undefined}
          />
        </svg>
      )}
    </span>
  );
};

export default HandDrawnUnderline;
