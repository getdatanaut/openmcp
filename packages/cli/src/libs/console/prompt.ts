import { confirm as _confirm, isCancel, password as _password, select } from '@clack/prompts';

const confirm = async (...args: Parameters<typeof _confirm>): Promise<boolean> => {
  const res = await _confirm(...args);
  if (isCancel(res)) {
    throw new Error('Operation cancelled');
  }

  return res;
};

const password = async (...args: Parameters<typeof _password>): Promise<string> => {
  const res = await _password(...args);
  if (isCancel(res)) {
    throw new Error('Operation cancelled');
  }

  return res;
};

export default {
  confirm,
  password,
  select,
} as const;
