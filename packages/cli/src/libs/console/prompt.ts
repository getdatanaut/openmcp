import {
  confirm as _confirm,
  isCancel,
  type Option,
  password as _password,
  select as _select,
  text as _text,
} from '@clack/prompts';

function assertFulfilled<V>(res: V): asserts res is V extends symbol ? never : V {
  if (isCancel(res)) {
    throw new Error('Operation cancelled');
  }
}

export const confirm = async (...args: Parameters<typeof _confirm>): Promise<boolean> => {
  const res = await _confirm(...args);
  assertFulfilled(res);
  return res;
};

export const maskedText = async (...args: Parameters<typeof _password>): Promise<string> => {
  const res = await _password(...args);
  assertFulfilled(res);
  return res;
};

export const text = async (...args: Parameters<typeof _text>): Promise<string> => {
  const res = await _text(...args);
  assertFulfilled(res);
  return res;
};

export const select = async <T>(...args: Parameters<typeof _select>): Promise<T> => {
  const res = await _select(...args);
  assertFulfilled(res);
  return res as T;
};

export type { Option };

export function username(message = 'Please insert username:'): Promise<string> {
  return text({
    message,
    validate: value => {
      if (value.trim().length === 0) {
        return 'Username cannot be empty';
      }
    },
  });
}

export const password = (message = 'Please insert password:'): Promise<string> => maskedText({ message });

export function url(message = 'Please provide URL:'): Promise<string> {
  return text({
    message,
    validate: url => {
      if (!URL.canParse(url)) {
        return 'Inserted invalid URL. Please provide a valid URL.';
      }
    },
  });
}
