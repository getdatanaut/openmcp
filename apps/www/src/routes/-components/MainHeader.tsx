import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@libs/ui-primitives';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentManager } from '~/hooks/use-current-manager.tsx';

export const MainHeader = ({ title }: { title: string }) => {
  const manager = useCurrentManager();

  const queryClient = useQueryClient();

  const { mutate: createThread } = useMutation({
    mutationFn: manager.threads.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });

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
