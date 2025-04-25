import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Icon, tn } from '@libs/ui-primitives';
import { Fragment } from 'react';

export function CanvasCrumbs({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="mx-auto flex items-center gap-3 text-sm font-light">
      {items.map((item, index) => (
        <Fragment key={index}>
          <div className={tn(index < items.length - 1 && 'ak-text/60')}>{item}</div>
          {index < items.length - 1 && (
            <>
              <Icon icon={faChevronRight} className="ak-text/50 text-[0.75em]" />
            </>
          )}
        </Fragment>
      ))}
    </div>
  );
}
