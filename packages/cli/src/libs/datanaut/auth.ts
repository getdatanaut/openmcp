// a set of wrappers around auth

import consola from '../../consola/index.ts';
import { login as _login } from '../auth/index.ts';

export async function login(): Promise<void> {
  consola.start('Logging in...');
  const { email } = await _login({
    async openPage(url: URL): Promise<boolean> {
      const res = await consola.prompt(`Do you want to open the login page in your browser?`, {
        type: 'confirm',
      });

      if (!res) {
        consola.info('Copy the URL from the terminal and open it in the browser');
        consola.log(url.toString());
      } else {
        consola.info('Opening the login page in your browser...');
        consola.info('If the browser does not open, copy the URL from the terminal and open it in the browser');
        consola.log(url.toString());
      }

      return res;
    },
  });
  consola.success(`Logged in successfully as ${email}`);
}
