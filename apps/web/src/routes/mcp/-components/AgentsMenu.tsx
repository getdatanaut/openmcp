import { faPlus } from '@fortawesome/free-solid-svg-icons';
import type { TAgentId } from '@libs/db-ids';
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuOptionGroup,
  MenuOptionItem,
  type MenuProps,
  MenuSeparator,
} from '@libs/ui-primitives';

import { useInsertAgent } from '~/hooks/use-insert-agent.ts';
import { useZeroQuery } from '~/hooks/use-zero-query.ts';

export interface AgentsMenuProps extends Pick<MenuProps, 'trigger'> {
  onSelect: (agentId: TAgentId) => void;
  activeAgentId?: TAgentId;
}

export function AgentsMenu({ activeAgentId, onSelect, trigger }: AgentsMenuProps) {
  const [agents] = useZeroQuery(z => z.query.agents.orderBy('name', 'asc'));

  const { mutate: insertAgent } = useInsertAgent();

  return (
    <Menu trigger={trigger}>
      <MenuItem icon={faPlus} onClick={() => insertAgent()}>
        New Remix
      </MenuItem>

      {agents.length > 0 ? <MenuSeparator /> : null}

      <MenuGroup label="Remixes">
        <MenuOptionGroup
          value={activeAgentId ?? ''}
          name="agent"
          onChange={v => {
            onSelect(v as TAgentId);
          }}
        >
          {agents.map(a => (
            <MenuOptionItem hideOnClick value={a.id}>
              {a.name}
            </MenuOptionItem>
          ))}
        </MenuOptionGroup>
      </MenuGroup>
    </Menu>
  );
}
