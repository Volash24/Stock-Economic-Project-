import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  // You can add specific props here if needed in the future
}

/**
 * Renders the Trade Lens logo SVG.
 * The color is determined by the `color` CSS property (defaults to the current text color).
 * Set the `color` style/class on this component or a parent to control its appearance
 * in light/dark modes.
 * @param props Standard SVG props like width, height, className, style, etc.
 */
const Logo: React.FC<LogoProps> = ({ width = "40px", height = "40px", ...props }) => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 512 512"
      xmlSpace="preserve"
      {...props} // Pass down className, style, etc.
    >
      <g>
        <polygon
          fill="currentColor" // Use currentColor for theme adaptability
          points="204.344,155.188 249.469,200.297 409.344,40.422 268.031,40.422 316.063,88.453 249.469,155.031 204.953,110.516 41.906,264.969 63.906,288.219"
        />
        <polygon
          fill="currentColor" // Use currentColor for theme adaptability
          points="512,102.313 276.031,330.281 212.656,266.906 0,471.578 512,471.578"
        />
      </g>
    </svg>
  );
};

export default Logo;
