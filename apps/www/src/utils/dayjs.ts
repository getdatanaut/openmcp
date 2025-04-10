import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import isToday from 'dayjs/plugin/isToday.js';
import isYesterday from 'dayjs/plugin/isYesterday.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(duration);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);

declare module 'dayjs' {
  interface Dayjs {
    isThisWeek(): boolean;
  }
}

/**
 * Should "this" week be in the last 7 days, or literally the current week?
 * For now it's implemented as the last 7 days.
 */
const isThisWeek: dayjs.PluginFunc = (_o, c, d) => {
  c.prototype.isThisWeek = function () {
    const now = d();

    return this.isBetween(now.subtract(1, 'week'), now, 'day');
  };
};

dayjs.extend(isThisWeek);

export { dayjs };
