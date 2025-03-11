import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { forwardRef, useMemo } from 'react';

interface FaProps {
  icon: IconDefinition;
  className?: string;

  // Duotone Icons
  primaryColor?: string;
  secondaryColor?: string;
  primaryOpacity?: number | string;
  secondaryOpacity?: number | string;
  swapOpacity?: boolean;
}

export const FaSvg = forwardRef<SVGSVGElement, FaProps>(function FaSvg(
  { icon, primaryColor, secondaryColor, swapOpacity, className, ...rest },
  ref,
) {
  const primaryOpacity = rest.primaryOpacity ?? 1;
  const secondaryOpacity = rest.secondaryOpacity ?? 0.4;

  const i = useMemo(() => icon.icon || ([0, 0, '', [], ''] as const), [icon]);

  return (
    <svg
      ref={ref}
      className={className}
      viewBox={`0 0 ${i[0]} ${i[1]}`}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={{ verticalAlign: '-0.125em' }}
    >
      {/* @ts-expect-error ignore */}
      <g transform={`translate(${i[0] / 2} ${i[1] / 2})`} transformOrigin={`${i[0] / 4} 0`}>
        {typeof i[4] === 'string' ? (
          <path
            d={i[4] as string}
            fill={primaryColor ?? 'currentColor'}
            transform={`translate(${i[0] / -2} ${i[1] / -2})`}
          />
        ) : (
          <>
            <path
              d={i[4][0]}
              fill={secondaryColor ?? 'currentColor'}
              fillOpacity={swapOpacity != false ? primaryOpacity : secondaryOpacity}
              transform={`translate(${i[0] / -2} ${i[1] / -2})`}
            />
            <path
              d={i[4][1]}
              fill={primaryColor ?? 'currentColor'}
              fillOpacity={swapOpacity != false ? secondaryOpacity : primaryOpacity}
              transform={`translate(${i[0] / -2} ${i[1] / -2})`}
            />
          </>
        )}
      </g>
    </svg>
  );
});
