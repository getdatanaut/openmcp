const ENV_VAR_REGEX = /(^|\s)(?<name>[A-Za-z_][A-Za-z0-9_]*)=/g;

function isWhitespace(code: number): boolean {
  return code === 0x20 || code === 0x09;
}

function eatValue(input: string, offset: number): { value: string; lastIndex: number } {
  if (offset - 1 === input.length || isWhitespace(input.charCodeAt(offset))) {
    return {
      value: '',
      lastIndex: offset,
    };
  }

  let i = offset;
  while (i < input.length) {
    const code = input.charCodeAt(i++);
    // " or '
    if (code === 0x22 || code === 0x27) {
      const start = i;
      while (i < input.length) {
        if (input.charCodeAt(i++) === code) {
          return {
            value: input.slice(start, i - 1),
            lastIndex: i,
          };
        }
      }

      throw new Error(`Unmatched quote at index ${i}`);
    } else if (isWhitespace(code)) {
      i--;
      break;
    }
  }

  return {
    value: input.slice(offset, i),
    lastIndex: i,
  };
}

type Variable = [name: string, value: string];

export default function parseEnvVariables(input: string): { vars: Variable[]; lastIndex: number } {
  ENV_VAR_REGEX.lastIndex = 0;

  const vars: Variable[] = [];
  let result = ENV_VAR_REGEX.exec(input);
  if (!result || result.index !== 0) {
    return {
      vars: [],
      lastIndex: 0,
    };
  }

  let lastIndex = ENV_VAR_REGEX.lastIndex;
  while (result) {
    const offset = ENV_VAR_REGEX.lastIndex;
    const { value, lastIndex: _offset } = eatValue(input, offset);
    ENV_VAR_REGEX.lastIndex = _offset;
    const name = result.groups!['name'] as string;
    vars.push([name, value]);
    lastIndex = ENV_VAR_REGEX.lastIndex;
    result = ENV_VAR_REGEX.exec(input);
  }

  return {
    vars,
    lastIndex,
  };
}
