<script>
  import { locale } from '@sveltia/i18n';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { Option, Select, Switch } from '#lib';
  import {
    getInitialHiddenStrings,
    getLocaleName,
    LOCALES,
    saveLocale,
    showHiddenStrings,
  } from './l10n.js';

  let showHidden = $state(getInitialHiddenStrings());

  $effect(() => {
    showHiddenStrings(showHidden);
  });

  /**
   * Switch the showcase to another locale, and keep it in the URL so the page can be shared or
   * reloaded in that locale.
   * @param {string} code Locale code.
   */
  const changeLocale = async (code) => {
    if (!code || code === locale.current) {
      return;
    }

    await locale.set(code);
    saveLocale(code);

    const url = new URL(page.url.href);

    url.searchParams.set('lang', code);
    // The current page’s own URL, with the locale added
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    replaceState(url, page.state);
  };
</script>

<div role="none" class="locale-tools">
  <Select
    aria-label="Language"
    value={locale.current}
    onChange={(/** @type {CustomEvent} */ event) => changeLocale(event.detail.value)}
  >
    {#each LOCALES as code (code)}
      <Option label="{code} — {getLocaleName(code, code)}" value={code} />
    {/each}
  </Select>
  <Switch bind:checked={showHidden}>Show hidden strings</Switch>
</div>

<style lang="scss">
  .locale-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
  }
</style>
