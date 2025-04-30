// a set of wrappers around auth

import console from '#libs/console';

import { login as _login, logout as _logout, whoami as _whoami } from './auth/index.ts';

export async function login(): Promise<void> {
  console.start('Logging in...');
  const { email } = await _login({
    async openPage(url: URL): Promise<boolean> {
      const res = await console.prompt(`Do you want to open the login page in your browser?`, {
        type: 'confirm',
      });

      if (!res) {
        console.info('Copy the URL from the terminal and open it in the browser');
        console.log(url.toString());
      } else {
        console.info('Opening the login page in your browser...');
        console.info('If the browser does not open, copy the URL from the terminal and open it in the browser');
        console.log(url.toString());
      }

      return res;
    },
  });
  console.success(`Logged in successfully as ${email}`);
}

export async function logout(): Promise<void> {
  console.start('Logging out...');
  await _logout();
  console.success('Logged out successfully');
}

export async function whoami(): Promise<void> {
  const { email } = _whoami();
  console.success(`You are logged in as ${email}`);
}
