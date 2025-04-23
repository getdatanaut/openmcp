import { createElement } from '@ariakit/react-core/utils/system';
import type { Options } from '@ariakit/react-core/utils/types';
import {
  faBars,
  faBug,
  faCaretDown,
  faCaretLeft,
  faCaretRight,
  faHome,
  faPlus,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';
import { AgentId, type TAgentId } from '@libs/db-ids';
import {
  Button,
  ButtonGroup,
  type ButtonProps,
  Icon,
  type IconProps,
  Menu,
  MenuOptionGroup,
  MenuOptionItem,
  PREBUILT_THEMES,
  tn,
  twMerge,
} from '@libs/ui-primitives';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useAtomInstance, useAtomState } from '@zedux/react';
import { useEffect } from 'react';

import { authAtom } from '~/atoms/auth.ts';
import { layoutAtom } from '~/atoms/layout.ts';
import { themeAtom } from '~/atoms/theme.ts';
import { useCurrentUser } from '~/hooks/use-current-user.ts';
import { useElementSize } from '~/hooks/use-element-size.ts';
import { useMutation } from '~/hooks/use-mutation.ts';
import { useQuery } from '~/hooks/use-query.ts';

export function MainSidebar({ className }: { className?: string }) {
  const auth = useAtomInstance(authAtom);
  const user = useCurrentUser();
  const [{ sidebarCollapsed }, { setSidebarCollapsed, setSidebarWidth }] = useAtomState(layoutAtom);

  const [ref, { width }] = useElementSize();

  useEffect(() => {
    setSidebarWidth(width);
  }, [width, setSidebarWidth]);

  return (
    <div
      ref={ref}
      className={twMerge('ease-spring flex flex-col transition-[width] duration-150 ease-in-out', className)}
    >
      {/* This header section stays visible even when collapsed */}
      <div className="ak-layer-0 relative top-2 z-10">
        <div className="h-14" />
        <div
          className={twMerge(
            'absolute top-0 left-3 flex h-10 items-center transition-[left,top] duration-200 ease-in-out',
            sidebarCollapsed && 'top-2 left-5',
          )}
        >
          <ButtonGroup size="sm" variant="outline">
            <Button
              icon={sidebarCollapsed ? faCaretRight : faCaretLeft}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <Button icon={faHome} render={<Link to="/" />} />
            <SettingsMenu />
            {user ? <Button icon={faBug} render={<Link to="/admin/upload-openapi" />} /> : null}
            {user ? <Button icon={faPowerOff} onClick={() => auth.exports.signOut()} /> : null}
          </ButtonGroup>
        </div>
      </div>

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
 * Settings
 */

function SettingsMenu() {
  const [{ themeId, fontId }, { setFontId, setThemeId }] = useAtomState(themeAtom);

  return (
    <Menu trigger={<Button icon={faBars} />}>
      <Menu label="Theme">
        <MenuOptionGroup label="Colors" value={themeId} onChange={setThemeId}>
          {PREBUILT_THEMES.map(theme => (
            <MenuOptionItem key={theme.id} value={theme.id}>
              {theme.name}
            </MenuOptionItem>
          ))}
        </MenuOptionGroup>
        <MenuOptionGroup label="Font" value={fontId} onChange={setFontId}>
          <MenuOptionItem value="mono">Mono</MenuOptionItem>
          <MenuOptionItem value="sans">Sans</MenuOptionItem>
        </MenuOptionGroup>
      </Menu>
    </Menu>
  );
}

/**
 * Agents
 */

function AgentsSidebar() {
  const navigate = useNavigate();
  const router = useRouter();
  const [agents] = useQuery(z => z.query.agents.orderBy('name', 'asc'));

  const { mutate: addAgent } = useMutation(
    async z => {
      const id = AgentId.generate();

      return {
        op: z.mutate.agents.insert({ id }),
        onClientSuccess: () => navigate({ to: '/agents/$agentId', params: { agentId: id } }),
        onServerError: () => {
          // @TODO: toast
          router.history.back();
        },
      };
    },
    [navigate, router.history],
  );

  return (
    <SidebarSection name="Agents" action={{ icon: faPlus, title: 'Add agent', onClick: addAgent }}>
      {agents?.map(agent => <AgentListItem key={agent.id} id={agent.id} name={agent.name} />)}
    </SidebarSection>
  );
}

function AgentListItem({ id, name }: { id: TAgentId; name: string }) {
  return <SidebarListItem name={name} render={<Link to="/agents/$agentId" params={{ agentId: id }} />} />;
}
