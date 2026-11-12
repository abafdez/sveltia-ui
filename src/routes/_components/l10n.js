/**
 * Helpers for the localization tools of the showcase: the language switcher, the hidden strings
 * toggle and the Localization page, which lists every string with its context.
 */

import { strings } from '#lib';

/**
 * Locale the other files are translated from.
 */
export const SOURCE_LOCALE = 'en-US';

/**
 * Local storage key of the locale chosen in the showcase.
 */
const LOCALE_STORAGE_KEY = 'sveltia-ui-showcase.locale';
/**
 * Local storage key of the hidden strings toggle.
 */
const HIDDEN_STRINGS_STORAGE_KEY = 'sveltia-ui-showcase.show-hidden-strings';

/**
 * Attribute set on the root element to reveal the strings that are normally hidden.
 */
export const HIDDEN_STRINGS_ATTR = 'data-show-hidden-strings';

/**
 * Codes of the available locales, sorted.
 */
export const LOCALES = Object.keys(strings).sort();

/**
 * Read a value from the local storage, which may be unavailable.
 * @param {string} key Key.
 * @returns {string | null} Value.
 */
const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * Write a value to the local storage, which may be unavailable.
 * @param {string} key Key.
 * @param {string} value Value.
 */
const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not saved, which only means the choice isn’t remembered
  }
};

/**
 * Get the locale to start the showcase in: the `lang` URL parameter, then the locale chosen last
 * time, then the source locale.
 * @returns {string} Locale code.
 */
export const getInitialLocale = () =>
  [new URLSearchParams(window.location.search).get('lang'), readStorage(LOCALE_STORAGE_KEY)].find(
    (code) => !!code && LOCALES.includes(code),
  ) ?? SOURCE_LOCALE;

/**
 * Remember the chosen locale.
 * @param {string} code Locale code.
 */
export const saveLocale = (code) => {
  writeStorage(LOCALE_STORAGE_KEY, code);
};

/**
 * Get whether the hidden strings were revealed last time.
 * @returns {boolean} Result.
 */
export const getInitialHiddenStrings = () => readStorage(HIDDEN_STRINGS_STORAGE_KEY) === 'true';

/**
 * Reveal or hide the strings that are normally hidden, and remember the choice.
 * @param {boolean} show Whether to reveal them.
 */
export const showHiddenStrings = (show) => {
  document.documentElement.toggleAttribute(HIDDEN_STRINGS_ATTR, show);
  writeStorage(HIDDEN_STRINGS_STORAGE_KEY, String(show));
};

/**
 * Get the name of a locale, written in another locale.
 * @param {string} code Locale code.
 * @param {string} displayLocale Locale to write the name in.
 * @returns {string} Name, e.g. `English (Canada)`, or the code if it can’t be named.
 */
export const getLocaleName = (code, displayLocale) => {
  try {
    return new Intl.DisplayNames([displayLocale], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
};

/**
 * Flatten a parsed locale file into dot-separated keys and their messages.
 * @param {Record<string, any> | undefined} resource Parsed file.
 * @param {string} [prefix] Key prefix used while recursing.
 * @returns {Map<string, any>} Messages keyed by their path.
 */
export const flattenStrings = (resource, prefix = '') =>
  new Map(
    Object.entries(resource ?? {}).flatMap(([key, value]) =>
      value && typeof value === 'object'
        ? [...flattenStrings(value, `${prefix}${key}.`)]
        : [[`${prefix}${key}`, value]],
    ),
  );

/**
 * Get the comment that describes each key of a locale file. A comment applies to the keys that
 * follow it at the same level, until a blank line or another comment, and a key without one gets
 * the comment of its group.
 * @param {string} source YAML source of the locale file.
 * @returns {Map<string, string>} Comments keyed by the path of the key they describe.
 */
export const parseComments = (source) => {
  /** @type {Map<string, string>} */
  const comments = new Map();
  /** @type {{ indent: number, key: string, comment: string }[]} */
  const groups = [];
  /** @type {Map<number, string>} */
  const runs = new Map();
  /** @type {string[]} */
  let pending = [];

  source.split('\n').forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      pending = [];
      runs.clear();

      return;
    }

    if (trimmed.startsWith('#')) {
      pending.push(trimmed.replace(/^#\s*/, ''));

      return;
    }

    const match = line.match(/^(\s*)(['"]?)([^'":]+)\2:(\s|$)/);

    if (!match) {
      return;
    }

    const indent = match[1].length;
    const key = match[3];

    while (groups.length && groups[groups.length - 1].indent >= indent) {
      groups.pop();
    }

    if (pending.length) {
      runs.set(indent, pending.join(' '));
      pending = [];
    }

    [...runs.keys()].filter((level) => level > indent).forEach((level) => runs.delete(level));

    const comment = runs.get(indent) ?? groups[groups.length - 1]?.comment ?? '';
    const path = [...groups.map((group) => group.key), key].join('.');

    if (/:\s*$/.test(line)) {
      groups.push({ indent, key, comment });
    } else {
      comments.set(path, comment);
    }
  });

  return comments;
};

/**
 * Showcase pages that demonstrate the components, by the start of the component file path. The
 * first match wins.
 * @type {[string, string[]][]}
 */
const DEMO_PAGES = [
  ['alert/infobar', ['infobar']],
  ['alert/', ['inline-alert', 'infobar', 'toast']],
  ['button/split-button', ['split-button']],
  ['calendar/', ['date-time']],
  ['checkbox/', ['checkbox']],
  ['dialog/', ['dialog']],
  ['disclosure/', ['disclosure']],
  ['emoji/', ['text-field', 'text-editor']],
  ['grid/', ['grid']],
  ['listbox/', ['listbox']],
  ['menu/', ['menu']],
  ['select/', ['select']],
  ['table/', ['table']],
  ['text-editor/code', ['code-editor']],
  ['text-editor/toolbar/code', ['code-editor']],
  ['text-editor/', ['text-editor']],
  ['text-field/', ['text-field']],
];

/**
 * Attributes whose value only screen readers read out.
 */
const SCREEN_READER_ATTRIBUTES = ['aria-label', 'aria-roledescription', 'aria-description'];

/**
 * Where a string is used.
 * @typedef {object} StringUsage
 * @property {string[]} files Component files, relative to `src/lib/components`.
 * @property {string[]} pages Keys of the showcase pages demonstrating those components.
 * @property {string[]} attributes Attributes the string is set in, such as `aria-label`.
 * @property {boolean} hidden Whether the string is only read out by screen readers.
 */

/**
 * Find where each string is used in the component sources. A key built at run time, such as
 * `_sui.alert.${status}`, counts as using every key it can produce.
 * @param {Record<string, string>} sources Component sources keyed by their path relative to
 * `src/lib/components`.
 * @param {string[]} keys Keys of the strings.
 * @returns {Map<string, StringUsage>} Usages keyed by string key.
 */
export const findUsages = (sources, keys) => {
  /** @type {Map<string, { files: Set<string>, attributes: Set<string>, hidden: boolean }>} */
  const found = new Map(
    keys.map((key) => [key, { files: new Set(), attributes: new Set(), hidden: false }]),
  );

  Object.entries(sources).forEach(([file, source]) => {
    source.split('\n').forEach((line) => {
      [...line.matchAll(/_sui\.([a-z0-9_]+(?:\.[a-z0-9_]+)*)(\.?\$\{)?/g)].forEach((match) => {
        const [, path, dynamic] = match;
        const prefix = `${path}.`;
        const matched = dynamic ? keys.filter((key) => key.startsWith(prefix)) : [path];
        // The attribute the call sits in, e.g. `aria-label={_('_sui.clear')}`
        const attribute = line.slice(0, match.index).match(/([\w-]+)=\{[^{}]*$/)?.[1];

        // The alert status is a visually hidden span, read out before the message
        const hidden =
          (!!attribute && SCREEN_READER_ATTRIBUTES.includes(attribute)) ||
          line.includes('status-label');

        matched.forEach((key) => {
          const usage = found.get(key);

          if (usage) {
            usage.files.add(file);

            if (attribute) {
              usage.attributes.add(attribute);
            }

            usage.hidden ||= hidden;
          }
        });
      });
    });
  });

  return new Map(
    [...found].map(([key, { files, attributes, hidden }]) => [
      key,
      {
        files: [...files].sort(),
        pages: [
          ...new Set(
            [...files].flatMap(
              (file) => DEMO_PAGES.find(([start]) => file.startsWith(start))?.[1] ?? [],
            ),
          ),
        ].sort(),
        attributes: [...attributes].sort(),
        hidden,
      },
    ]),
  );
};

/**
 * Load the sources of the components, without their tests.
 * @returns {Promise<Record<string, string>>} Sources keyed by their path relative to
 * `src/lib/components`.
 */
export const loadComponentSources = async () => {
  const loaders = import.meta.glob(
    [
      '/src/lib/components/**/*.{svelte,js}',
      '!/src/lib/components/**/*.test.js',
      '!/src/lib/components/**/*.test.svelte',
    ],
    { query: '?raw', import: 'default' },
  );

  return Object.fromEntries(
    await Promise.all(
      Object.entries(loaders).map(async ([path, load]) => [
        path.replace('/src/lib/components/', ''),
        /** @type {string} */ (await load()),
      ]),
    ),
  );
};

/**
 * Load the YAML source of the source locale file, with its comments.
 * @returns {Promise<string>} Source.
 */
export const loadSourceLocaleFile = async () =>
  /** @type {string} */ ((await import('#lib/locales/en-US.yaml?raw')).default);
