import { maskedText, text } from './text.ts';

export const username = (message = 'Please insert username:') =>
  text({
    message,
    validate: value => {
      if (value.trim().length === 0) {
        return 'Username cannot be empty';
      }
    },
  });

export const password = (message = 'Please insert password:') =>
  maskedText({
    message,
  });
