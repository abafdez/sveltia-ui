<script>
  import { locale } from '@sveltia/i18n';
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import {
    Alert,
    AlertDialog,
    Button,
    Infobar,
    NumberInput,
    Option,
    PasswordInput,
    SearchBar,
    SecretInput,
    Select,
    strings,
    TextInput,
    Toast,
  } from '#lib';
  import ConfirmationDialog from '#lib/components/dialog/confirmation-dialog.svelte';
  import PromptDialog from '#lib/components/dialog/prompt-dialog.svelte';
  import Example from '../../_components/example.svelte';
  import {
    findUsages,
    flattenStrings,
    getLocaleName,
    loadComponentSources,
    loadSourceLocaleFile,
    parseComments,
    SOURCE_LOCALE,
  } from '../../_components/l10n.js';

  /**
   * @import { StringUsage } from '../../_components/l10n.js';
   */

  /** @type {('error' | 'warning' | 'info' | 'success')[]} */
  const STATUSES = ['error', 'warning', 'info', 'success'];

  let openAlertDialog = $state(false);
  let openConfirmationDialog = $state(false);
  let openPromptDialog = $state(false);
  let promptValue = $state('');
  /** @type {Record<string, boolean>} */
  const shownToasts = $state(Object.fromEntries(STATUSES.map((status) => [status, false])));
  /** @type {Record<string, boolean>} */
  const infobarShown = $state(Object.fromEntries(STATUSES.map((status) => [status, true])));
  let filter = $state('all');
  let query = $state('');
  /** @type {Map<string, string>} */
  let comments = $state(new Map());
  /** @type {Map<string, StringUsage>} */
  let usages = $state(new Map());

  const sourceStrings = flattenStrings(strings[SOURCE_LOCALE]);
  const keys = [...sourceStrings.keys()];
  const currentLocale = $derived(locale.current ?? SOURCE_LOCALE);
  const translatedStrings = $derived(flattenStrings(strings[currentLocale]));

  const rows = $derived(
    keys.map((key) => {
      const source = sourceStrings.get(key);
      const translation = translatedStrings.get(key);

      return {
        key,
        source,
        translation,
        missing: translation === undefined || translation === null || translation === '',
        same: currentLocale !== SOURCE_LOCALE && translation === source,
        comment: comments.get(key) ?? '',
        usage: usages.get(key),
      };
    }),
  );

  const visibleRows = $derived(
    rows.filter((row) => {
      if (filter === 'missing' && !row.missing) {
        return false;
      }

      if (filter === 'same' && !row.same) {
        return false;
      }

      if (filter === 'hidden' && !row.usage?.hidden) {
        return false;
      }

      const text = `${row.key} ${row.source} ${row.translation ?? ''}`.toLocaleLowerCase();

      return !query || text.includes(query.toLocaleLowerCase());
    }),
  );

  const missingCount = $derived(rows.filter((row) => row.missing).length);

  /**
   * Get the route of a component’s demo page. The keys come from a list of existing pages, which
   * the route types can’t check.
   * @param {string} key Page key, e.g. `text-field`.
   * @returns {any} Route.
   */
  const getDemoRoute = (key) => `/components/${key}`;

  onMount(async () => {
    const [source, components] = await Promise.all([
      loadSourceLocaleFile(),
      loadComponentSources(),
    ]);

    comments = parseComments(source);
    usages = findUsages(components, keys);
  });
</script>

<svelte:head>
  <title>Localization – Sveltia UI</title>
</svelte:head>

<h2>Localization</h2>

<ul>
  <li>Pick a language at the top of the page to see every component in it.</li>
  <li>
    Turn on <strong>Show hidden strings</strong> to reveal the strings only screen readers read out:
    <code>aria-label</code> in yellow, role descriptions in blue, alert statuses in green.
  </li>
  <li>
    Strings in the attributes of an input field can’t be revealed; the table below lists them.
  </li>
</ul>
<p>
  Translating into {getLocaleName(currentLocale, 'en')} (<code>{currentLocale}</code>): edit
  <code>src/lib/locales/{currentLocale}.yaml</code>. The page updates as you save.
</p>

<section>
  <h3>Dialogs</h3>
  <Example>
    <div role="none">
      <Button
        variant="secondary"
        label="Alert Dialog"
        onclick={() => {
          openAlertDialog = true;
        }}
      />
      <AlertDialog bind:open={openAlertDialog} title="Alert">
        An alert dialog has an OK button.
      </AlertDialog>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Confirmation Dialog"
        onclick={() => {
          openConfirmationDialog = true;
        }}
      />
      <ConfirmationDialog bind:open={openConfirmationDialog} title="Confirmation">
        A confirmation dialog has OK and Cancel buttons.
      </ConfirmationDialog>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Prompt Dialog"
        onclick={() => {
          openPromptDialog = true;
        }}
      />
      <PromptDialog bind:open={openPromptDialog} bind:value={promptValue} title="Prompt">
        A prompt dialog has a text field, and OK and Cancel buttons.
      </PromptDialog>
    </div>
  </Example>
</section>

<section>
  <h3>Toasts</h3>
  <Example>
    {#each STATUSES as status (status)}
      <div role="none">
        <Button
          variant="secondary"
          label="{status} toast"
          onclick={() => {
            shownToasts[status] = true;
          }}
        />
        <Toast bind:show={shownToasts[status]}>
          <Alert {status}>A toast with the {status} status.</Alert>
        </Toast>
      </div>
    {/each}
  </Example>
</section>

<section>
  <h3>Infobar and inline alert</h3>
  <Example>
    <div role="none" class="stack">
      {#each STATUSES as status (status)}
        <Infobar
          bind:show={infobarShown[status]}
          {status}
          dismissible
          onDismiss={() => {
            infobarShown[status] = false;
          }}
        >
          A dismissible infobar with the {status} status.
        </Infobar>
      {/each}
      <Button
        variant="tertiary"
        label="Show every infobar again"
        onclick={() => {
          STATUSES.forEach((status) => {
            infobarShown[status] = true;
          });
        }}
      />
      {#each STATUSES as status (status)}
        <Alert {status}>An inline alert with the {status} status.</Alert>
      {/each}
    </div>
  </Example>
</section>

<section>
  <h3>Text fields</h3>
  <Example>
    <div role="none" class="stack">
      <SearchBar value="Clear me" />
      <PasswordInput value="password" />
      <SecretInput value="secret" />
      <NumberInput value={5} min={1} max={10} />
      <!-- Without stepping, the allowed range is described to screen readers instead -->
      <NumberInput value={5} min={1} max={10} step={-1} />
      <TextInput
        value=""
        placeholder="Type : and a few letters, e.g. :smi, for the emoji suggestions"
        useEmojiAutocomplete
      />
    </div>
  </Example>
</section>

<section>
  <h3>
    Strings ({keys.length}{currentLocale === SOURCE_LOCALE
      ? ''
      : `, ${missingCount} missing in ${currentLocale}`})
  </h3>
  <div role="none" class="filters">
    <Select aria-label="Filter" bind:value={filter}>
      <Option label="All strings" value="all" />
      <Option label="Missing in this locale" value="missing" />
      <Option label="Same as English" value="same" />
      <Option label="Hidden, for screen readers" value="hidden" />
    </Select>
    <SearchBar aria-label="Search the strings" bind:value={query} />
    <span role="status">{visibleRows.length} shown</span>
  </div>
  <table class="strings">
    <thead>
      <tr>
        <th scope="col">Key and context</th>
        <th scope="col">{SOURCE_LOCALE}</th>
        <th scope="col">{currentLocale}</th>
        <th scope="col">Where</th>
      </tr>
    </thead>
    <tbody>
      {#each visibleRows as row (row.key)}
        <tr class:missing={row.missing} class:same={row.same}>
          <td>
            <code>{row.key}</code>
            {#if row.comment}
              <div class="comment">{row.comment}</div>
            {/if}
          </td>
          <td>{row.source}</td>
          <td>
            {#if row.missing}
              <span class="flag">Missing: shows the English string</span>
            {:else}
              {row.translation}
            {/if}
          </td>
          <td>
            {#if row.usage}
              {#if row.usage.hidden}
                <span class="badge hidden">screen readers</span>
              {/if}
              {#each row.usage.attributes as attribute (attribute)}
                <span class="badge">{attribute}</span>
              {/each}
              <div class="pages">
                {#each row.usage.pages as key (key)}
                  <a href="{resolve(getDemoRoute(key))}?lang={currentLocale}">{key}</a>
                {/each}
              </div>
              <div class="files">{row.usage.files.join(', ')}</div>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<style lang="scss">
  .stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
    margin: 0 0 16px;
  }

  .strings {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--sui-font-size-small);

    th,
    td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--sui-secondary-border-color);
      text-align: start;
      vertical-align: top;
    }

    th {
      background-color: var(--sui-secondary-background-color);
    }

    tr.missing td:nth-child(3) {
      color: var(--sui-error-foreground-color);
    }

    tr.same td:nth-child(3) {
      color: var(--sui-warning-foreground-color);
    }
  }

  .pages {
    display: flex;
    flex-wrap: wrap;
    gap: 0 8px;
  }

  .comment,
  .files {
    margin: 4px 0 0;
    color: var(--sui-tertiary-foreground-color);
  }

  .badge {
    display: inline-block;
    margin: 0 4px 4px 0;
    border-radius: 4px;
    padding: 0 4px;
    background-color: var(--sui-secondary-background-color);
    font-family: var(--sui-font-family-monospace, monospace);

    &.hidden {
      background-color: #fff3bf;
      color: #000;
    }
  }

  .flag {
    font-weight: var(--sui-font-weight-bold, bold);
  }
</style>
