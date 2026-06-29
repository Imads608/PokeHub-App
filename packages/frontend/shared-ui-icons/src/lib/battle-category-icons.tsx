import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Pokemon move category icons — faithful recreations of the
 * official Gen IV+ Physical / Special / Status symbols.
 *
 * All icons use `currentColor` so they inherit text color from their
 * parent and remain legible on any background (e.g. type-colored move buttons).
 */

/**
 * Physical category — starburst explosion shape.
 * Jagged multi-pointed star with an inner glow circle.
 */
export function PhysicalIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M12 1.5
           L13.8 8.2 L19.5 4.5 L16.2 10.2 L23 11.5
           L16.5 13.2 L20 19.5 L14 15.5 L12 22.5
           L10 15.5 L4 19.5 L7.5 13.2 L1 11.5
           L7.8 10.2 L4.5 4.5 L10.2 8.2 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <circle cx="12" cy="11.5" r="3.2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/**
 * Special category — concentric circles (ripple/target).
 * Three full nested rings radiating outward with a center dot.
 */
export function SpecialIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.8" opacity="0.4" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="2" opacity="0.8" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Status category — yin-yang swirl / spiral.
 * Two S-curved arcs forming a circular rotation pattern.
 */
export function StatusIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      {/* Top swirl: right → up → over to center */}
      <path
        d="M20 12 A8 8 0 0 0 12 4 A4 4 0 0 1 12 12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* Bottom swirl: left → down → under to center */}
      <path
        d="M4 12 A8 8 0 0 0 12 20 A4 4 0 0 1 12 12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Accent dots at curl tips */}
      <circle cx="20" cy="12" r="1.2" fill="currentColor" opacity="0.85" />
      <circle cx="4" cy="12" r="1.2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

