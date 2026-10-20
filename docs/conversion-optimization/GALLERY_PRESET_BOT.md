# Gallery Bot preset contract

The content render bot (`lib/content/run.ts`, cron `app/api/cron/content-renders`) is unchanged. This is the interface it can call when it is ready to attach preset metadata to a gallery entry.

## Validate before publish

`validateGalleryBotPreset` in `lib/gallery/presets.ts` accepts an unknown JSON object and returns either a `DesignPreset` (`schemaVersion: 1`) or a list of errors.

Rules the validator enforces:

- `id` and `slug` match `^[a-z0-9-]{3,80}$`.
- `category` is `interior`, `exterior`, or `landscape`.
- `controls` may only contain keys and values that the matching Studio form already offers. Unknown keys and unsupported values are removed. They are not written into the URL.
- `promptBrief` is plain text, capped at 240 characters. It becomes the editable Studio design note.
- `referenceImage.src` must be an existing local path under `/gallery/` (`jpg`, `jpeg`, `png`, or `webp`). Remote URLs are dropped. If no honest asset exists, send `null`.
- `usageCount` is an integer count of completed renders, or `null`. Do not send a count that was not measured. The gallery shows "Popular" only when `usageCount` is greater than zero.
- `featured` and `isNew` are curator flags. They are not usage claims.

A valid result is not inserted into the live catalog automatically. The catalog in `lib/gallery/presets.ts` is the reviewed set.

## How a published job connects today

Published rows already have `concept_key`, `render_type`, `region`, `tags`, and `details` on `content_render_jobs`.

When the bot publishes a job that illustrates a catalog preset, set `concept_key` to that preset's `slug`. The gallery detail page resolves the key and shows "Create This Look on My Property".

When `concept_key` does not match a catalog preset, the gallery builds a one-visit preset from `render_type` and `details`:

- Detail text is copied into the editable design note.
- A Studio control is set only when the detail text names one of that control's existing options.
- `usageCount` stays `null`.

That derived preset is kept in `sessionStorage` for the browser tab so a refresh on the Studio URL can restore it. It is not trusted from the query string. The query string only carries `preset=<slug>`.

## Do not

- Do not put Studio field values in the query string.
- Do not label a stock photo or a concept render as a finished client project.
- Do not write `usageCount` from impressions, plan size, or a guessed number.
