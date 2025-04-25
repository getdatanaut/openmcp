import { faBug, faPalette, faPowerOff } from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  ButtonGroup,
  Menu,
  MenuOptionGroup,
  MenuOptionItem,
  type MenuProps,
  PREBUILT_THEMES,
  tn,
} from '@libs/ui-primitives';
import { Link } from '@tanstack/react-router';
import { useAtomInstance, useAtomState } from '@zedux/react';

import { authAtom } from '~/atoms/auth.ts';
import { layoutAtom } from '~/atoms/layout.ts';
import { themeAtom } from '~/atoms/theme.ts';
import { useCurrentUser } from '~/hooks/use-current-user.ts';

export function GlobalActions() {
  const auth = useAtomInstance(authAtom);
  const user = useCurrentUser();

  const [{ canvasHasHeader }] = useAtomState(layoutAtom);

  return (
    <div
      className={tn(
        'absolute left-[calc(var(--canvas-m)+3px)] z-10 flex h-[var(--canvas-header-h)] items-center transition-[left,top] duration-200 ease-in-out',
        canvasHasHeader ? 'top-0' : 'top-[var(--canvas-m)] left-[calc(var(--canvas-m)+12px)]',
      )}
    >
      <ButtonGroup size="sm" variant="outline">
        {/* <Button
          icon={sidebarCollapsed ? faCaretRight : faCaretLeft}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        /> */}

        <ThemeMenu trigger={<Button icon={faPalette} />} />

        {!user ? <Button render={<Link to="/signup" />}>Sign Up</Button> : null}
        {!user ? <Button render={<Link to="/login" />}>Log In</Button> : null}
        {user ? <Button icon={faBug} render={<Link to="/admin/upload-openapi" />} /> : null}
        {user ? <Button icon={faPowerOff} onClick={() => auth.exports.signOut()} /> : null}
      </ButtonGroup>
    </div>
  );
}

// function SettingsMenu() {
//   return (
//     <Menu trigger={<Button icon={faBars} />}>
//       <ThemeMenu label="Theme" />
//     </Menu>
//   );
// }

function ThemeMenu(props: MenuProps) {
  const [{ themeId, fontId }, { setFontId, setThemeId }] = useAtomState(themeAtom);

  return (
    <Menu {...props}>
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
  );
}
