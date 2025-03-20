import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@libs/ui-primitives';

export const MainHeader = ({ title }: { title: string }) => {
  return (
    <div className="ak-layer-0 sticky top-0 z-10 flex h-12 items-center border-b-[0.5px]">
      <div className="flex h-full w-14 items-center justify-center">
        <Button icon={faPlus} size="xs" variant="solid" intent="primary" />
      </div>

      <div className="flex h-full flex-1 items-center gap-4 border-l-[0.5px] px-4">
        {title ? <div className="mx-auto text-sm">{title}</div> : null}
      </div>
    </div>
  );
};
