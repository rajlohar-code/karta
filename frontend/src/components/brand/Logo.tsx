import React from 'react';

/**
 * Props (Parameters) for the Logo Component.
 * 
 * -----------------------------------------------------------------------------
 * PYTHON BRIDGE:
 * In Python / Pydantic:
 *   class LogoProps(BaseModel):
 *       size: Literal["sm", "md", "lg"] = "md"
 *       show_wordmark: bool = True
 *       className: str = ""
 * -----------------------------------------------------------------------------
 */
export interface LogoProps {
  /**
   * Predefined size variants:
   * - 'sm': 24x24 icon (ideal for dense headers, mobile)
   * - 'md': 32x32 icon (standard navbar size per karta_design_system.md)
   * - 'lg': 40x40 icon (hero / modal header size)
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether to display the text wordmark "Karta" alongside the icon.
   * Default: true
   */
  showWordmark?: boolean;

  /**
   * Font weight for the wordmark "Karta":
   * - 'bold': font-weight 700 (Default, punchy and solid)
   * - 'extrabold': font-weight 800 (ultra heavy)
   * - 'semibold': font-weight 600
   */
  fontWeight?: 'semibold' | 'bold' | 'extrabold';

  /**
   * Optional custom CSS class for extra styling/margins
   */
  className?: string;
}

/**
 * Size mapping configuration:
 * Maps size variant to exact pixel dimensions and wordmark typography.
 */
const SIZE_CONFIG = {
  sm: {
    iconPixels: 24,
    wordmarkSize: 'text-lg',
    gap: 'gap-2',
  },
  md: {
    iconPixels: 32,
    wordmarkSize: 'text-[22px]',
    gap: 'gap-2.5',
  },
  lg: {
    iconPixels: 40,
    wordmarkSize: 'text-2xl',
    gap: 'gap-3',
  },
} as const;

/**
 * Logo Component — Karta's Official Brand Mark
 * Grounded in: karta_design_system.md (Section "Logo")
 * 
 * DESIGN PRECISION (100% SVG Vector Geometry):
 * - Built using exact SVG viewBox (32 x 32) so all elements scale with mathematical precision.
 * - Outer squircle: #16a34a (Primary Green) with 8px radius.
 * - Top-Left node (Schema Table): x=8, y=8, w=6.5, h=6.5, rx=1.5
 * - Top-Right node (Flowchart): x=17.5, y=8, w=6.5, h=6.5, rx=1.5
 * - Bottom-Left node (Relation): x=8, y=17.5, w=6.5, h=6.5, rx=1.5
 * - Bottom-Right PLUS (+): Mathematically centered at cx=20.75, cy=20.75
 *   (Exactly aligned on both X-axis with Top-Right and Y-axis with Bottom-Left!)
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  fontWeight = 'bold',
  className = '',
}) => {
  const config = SIZE_CONFIG[size];

  return (
    <div className={`inline-flex items-center ${config.gap} select-none ${className}`}>
      {/* ----------------------------------------------------------------- */}
      {/* 1. Official SVG Brand Mark (Mathematically Centered Vector)       */}
      {/* ----------------------------------------------------------------- */}
      <svg
        width={config.iconPixels}
        height={config.iconPixels}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 cursor-pointer shadow-sm hover:brightness-105 transition-all"
        role="img"
        aria-label="Karta Logo"
      >
        {/* Background Squircle */}
        <rect
          width="32"
          height="32"
          rx="8"
          fill="#16a34a"
        />

        {/* Top-Left: Schema Table Node */}
        <rect
          x="8"
          y="8"
          width="6.5"
          height="6.5"
          rx="1.5"
          fill="white"
        />

        {/* Top-Right: Flowchart Process Node */}
        <rect
          x="17.5"
          y="8"
          width="6.5"
          height="6.5"
          rx="1.5"
          fill="white"
        />

        {/* Bottom-Left: Relation / Model Node */}
        <rect
          x="8"
          y="17.5"
          width="6.5"
          height="6.5"
          rx="1.5"
          fill="white"
        />

        {/* 
          Bottom-Right: AI Plus (+) Symbol
          Center: cx = 20.75, cy = 20.75
          Horizontal Bar: width = 6.2, height = 2.2, rx = 0.8
          Vertical Bar:   width = 2.2, height = 6.2, rx = 0.8
        */}
        <g id="ai-plus-symbol">
          {/* Horizontal Bar */}
          <rect
            x="17.65"
            y="19.65"
            width="6.2"
            height="2.2"
            rx="0.8"
            fill="white"
          />
          {/* Vertical Bar */}
          <rect
            x="19.65"
            y="17.65"
            width="2.2"
            height="6.2"
            rx="0.8"
            fill="white"
          />
        </g>
      </svg>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Wordmark ("Karta")                                            */}
      {/* Spec: font-bold (700) / color #166534 / letter-spacing -0.5px     */}
      {/* ----------------------------------------------------------------- */}
      {showWordmark && (
        <span
          className={`${
            fontWeight === 'extrabold'
              ? 'font-extrabold'
              : fontWeight === 'semibold'
              ? 'font-semibold'
              : 'font-bold'
          } text-karta-800 tracking-[-0.5px] ${config.wordmarkSize} leading-none`}
        >
          Karta
        </span>
      )}
    </div>
  );
};

export default Logo;
