/**
 * More info: https://github.com/kysely-org/kysely/issues/961#issuecomment-2754849462
 */

import { CamelCasePlugin, type CamelCasePluginOptions, type UnknownRow } from 'kysely';
import isPlainObject from 'lodash/isPlainObject';

export class MyCamelCasePlugin extends CamelCasePlugin {
  private _excludedColumns: string[];

  constructor({ excludeColumns = [], ...opt }: CamelCasePluginOptions & { excludeColumns?: string[] } = {}) {
    super(opt);
    this._excludedColumns = excludeColumns;
  }

  protected override mapRow(row: UnknownRow): UnknownRow {
    return Object.keys(row).reduce((obj: Record<string, any>, key) => {
      let value = row[key];
      if (this._excludedColumns.includes(key) || key.endsWith('_json')) {
        obj[key] = value;
      } else if (Array.isArray(value)) {
        value = value.map(it => (this.canMap(it, this.opt) ? this.mapRow(it) : it));
      } else if (this.canMap(value, this.opt)) {
        value = this.mapRow(value as UnknownRow);
      }
      obj[this.camelCase(key)] = value;
      return obj;
    }, {});
  }

  private canMap(obj: any, opt: any) {
    return isPlainObject(obj) && !opt?.maintainNestedObjectKeys;
  }
}
