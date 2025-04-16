import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Button, Menu, MenuOptionGroup, MenuOptionItem, PREBUILT_THEMES } from '@libs/ui-primitives';
import { useAtomState } from '@zedux/react';

import { themeAtom } from '~/atoms/theme.ts';

export function SettingsMenu() {
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
