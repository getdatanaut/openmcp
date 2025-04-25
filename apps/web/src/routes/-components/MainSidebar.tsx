import { createElement } from '@ariakit/react-core/utils/system';
import type { Options } from '@ariakit/react-core/utils/types';
import { faCaretDown, faPlus } from '@fortawesome/free-solid-svg-icons';
import { type TAgentId } from '@libs/db-ids';
import { Button, type ButtonProps, Icon, type IconProps, tn, twMerge, useElementSize } from '@libs/ui-primitives';
import { Link } from '@tanstack/react-router';
import { useAtomState } from '@zedux/react';
import { useEffect } from 'react';

import { layoutAtom } from '~/atoms/layout.ts';
import { useInsertAgent } from '~/hooks/use-insert-agent.ts';
import { useZeroQuery } from '~/hooks/use-zero-query.ts';

export function MainSidebar({ className }: { className?: string }) {
  const [{ sidebarCollapsed }, { setSidebarWidth }] = useAtomState(layoutAtom);

  const [ref, { width }] = useElementSize();

  useEffect(() => {
    setSidebarWidth(width);
  }, [width, setSidebarWidth]);

  return (
    <div
      ref={ref}
      className={twMerge('ease-spring flex flex-col transition-[width] duration-150 ease-in-out', className)}
    >
      {/* Spacer for absolutely positioned <GlobalActions /> */}
      <div className="h-[var(--canvas-header-h)]" />

      {/* Everything below the header fades in/out */}
      {/* <div
        className={twMerge(
          'flex shrink-0 flex-col items-start gap-1 py-5 pl-3 transition-opacity duration-100',
          app.sidebarCollapsed ? 'opacity-0' : 'opacity-100',
        )}
      >
        <SidebarListItem
          name="History"
          isActive={sidebar === 'history'}
          icon={faComments}
          render={<Link to="." search={{ sidebar: 'history' }} />}
        />
        <SidebarListItem
          name="Servers"
          isActive={sidebar === 'servers'}
          icon={faServer}
          render={<Link to="." search={{ sidebar: 'servers' }} />}
        />
      </div> */}

      <div
        className={twMerge(
          'flex-1 overflow-y-auto pb-12 transition-opacity duration-100',
          sidebarCollapsed ? 'opacity-0' : 'opacity-100',
        )}
      >
        <AgentsSidebar />
      </div>
    </div>
  );
}

function SidebarSection({
  name,
  children,
  collapsible = false,
  action,
}: {
  name: string;
  children: React.ReactNode;
  collapsible?: boolean;
  action?: ButtonProps;
}) {
  return (
    <div>
      <div className="ak-layer-0 sticky top-0 z-10 flex h-10 cursor-default items-center gap-2.5 border-y pr-3 pl-4.5 text-sm">
        {collapsible ? <Icon icon={faCaretDown} className="pl-0.5 text-[0.8em]" /> : null}
        <div className="flex-1">{name}</div>
        {action ? <Button variant="ghost" size="xs" {...action} /> : null}
      </div>

      <div className="flex flex-col gap-1 px-2 py-3">{children}</div>
    </div>
  );
}

function SidebarListItem({
  name,
  icon,
  action,
  isActive,
  ...rest
}: {
  name: string;
  icon?: IconProps['icon'];
  action?: ButtonProps;
  isActive?: boolean;
  ref?: React.Ref<HTMLElement>;
} & Options) {
  const className = tn(
    'group hover:ak-layer-hover-[0.7] active:ak-layer-hover flex cursor-pointer items-center gap-2 rounded-xs py-1.5 pr-2 pl-2.5 active:cursor-default',
  );

  const children = (
    <>
      {icon ? <Icon icon={icon} className="text-xs" fw /> : null}

      <div className="truncate text-sm">{name}</div>

      {action ? (
        <Button
          variant="ghost"
          size="xs"
          {...action}
          className={tn('invisible ml-auto group-hover:visible', action.className)}
        />
      ) : null}
    </>
  );

  return createElement('div', { ...rest, className, children, 'data-active': isActive || undefined });
}

/**
 * Agents
 */

function AgentsSidebar() {
  const [agents] = useZeroQuery(z => z.query.agents.orderBy('name', 'asc'));

  const { mutate: insertAgent } = useInsertAgent();

  return (
    <SidebarSection name="Agents" action={{ icon: faPlus, title: 'Add agent', onClick: insertAgent }}>
      {agents?.map(agent => <AgentListItem key={agent.id} id={agent.id} name={agent.name} />)}
    </SidebarSection>
  );
}

function AgentListItem({ id, name }: { id: TAgentId; name: string }) {
  return <SidebarListItem name={name} render={<Link to="/mcp/$agentId" params={{ agentId: id }} />} />;
}
