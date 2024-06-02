import { getOptions } from './utils/jsTools.js';
import { mutationManager } from './utils/mutation.js';

const { DateTime } = luxon;
const customClass = 'ch-utils-timestamps';
const timeSelector = 'time[datetime]:has(a)';

let formatOpts, opts;

const addTimestamps = timeElements => {
  for (const timeElement of timeElements) {
    let time;
    const iso = timeElement.dateTime;
    const url = timeElement.querySelector('a').href;
    try {
      time = DateTime.fromISO(iso).toLocaleString(formatOpts, opts).toLowerCase();
    } catch {
      time = DateTime.fromISO(iso).toLocaleString(formatOpts).toLowerCase(); //fallback for invalid locale
    }
    const formattedTime = $(`<a class="${customClass} hover:underline" href="${url}">${time}</a>`)[0];
    timeElement.append(formattedTime);
  }
};

export const main = async () => {
  ({ formatOpts, opts } = await getOptions('timestamps'));

  try { formatOpts = JSON.parse(`"${formatOpts}"`); }
  catch {
    try { formatOpts = JSON.parse(formatOpts); }
    catch { formatOpts = DateTime.DATE_MED; }
  }
  try { opts = JSON.parse(opts); }
  catch {
    try { opts = JSON.parse(`"${opts}"`); }
    catch { opts = 'zebes' }
  }

  if (typeof formatOpts === 'string' && formatOpts in DateTime) formatOpts = DateTime[formatOpts];

  mutationManager.start(timeSelector, addTimestamps);
};

export const clean = async () => {
  $(`.${customClass}`).remove();
  mutationManager.stop(addTimestamps);
};