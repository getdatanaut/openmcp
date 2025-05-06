import { text } from './text.ts';

export default function url(message = 'Please provide URL:'): Promise<string> {
  return text({
    message,
    validate: url => {
      if (!URL.canParse(url)) {
        return 'Inserted invalid URL. Please provide a valid URL.';
      }
    },
  });
}
