/**
 * Copyright 2018 Stoplight, Inc.
 * Copyright 2025 Datanaut Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// https://github.com/stoplightio/spectral/blob/a6653611bdc7d9d4d7e3f96dbae4eb63f2070e26/packages/rulesets/src/shared/functions/serverVariables/utils/applyUrlVariables.ts
type Variable = readonly [name: string, values: readonly string[]];
type ApplicableVariable = readonly [name: RegExp, encodedValues: readonly string[]];

export default function applyUrlVariables(url: string, variables: readonly Variable[]): string[] {
  if (variables.length === 0) {
    return [url];
  }

  const urls: string[] = [];
  _applyUrlVariables(urls, url, 0, variables.map(toApplicableVariable));
  return urls;
}

// this loosely follows https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.2
function _applyUrlVariables(urls: string[], url: string, i: number, variables: readonly ApplicableVariable[]): void {
  const [name, values] = variables[i]!;
  let x = 0;
  while (x < values.length) {
    const substitutedValue = url.replace(name, values[x]!);

    if (i === variables.length - 1) {
      urls.push(substitutedValue);
    } else {
      _applyUrlVariables(urls, substitutedValue, i + 1, variables);
    }

    x++;
  }
}

function toApplicableVariable([name, values]: Variable): ApplicableVariable {
  return [toReplaceRegExp(name), values.map(encodeURI)];
}

function toReplaceRegExp(name: string): RegExp {
  return RegExp(escapeRegexp(`{${name}}`), 'g');
}

// https://github.com/tc39/proposal-regex-escaping/blob/main/polyfill.js
function escapeRegexp(value: string): string {
  return value.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}
