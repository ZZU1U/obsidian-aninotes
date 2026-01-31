# Anime note templates (Clipper-style)

Templates use **variables** in double curly braces and optional **filters** with a pipe, similar to Obsidian Web Clipper.

## Syntax

- `{{variable}}` — insert value (e.g. `{{title}}`, `{{media_type}}`)
- `{{variable|filter}}` — apply one filter (e.g. `{{title|wikilink}}` → `[[Title]]`)
- `{{variable|filter:arg}}` — filter with one argument (e.g. `{{genres|join:", "}}`)
- `{{variable|f1|f2}}` — chain filters (e.g. `{{genres|map:name|join:", "}}`)

Nested keys use dot notation: `{{main_picture.medium}}`, `{{alternative_titles.en}}`.

## Template context (anime)

| Variable | Example |
|----------|--------|
| `title`, `en_title`, `ja_title` | Title strings |
| `media_type`, `status`, `source`, `rating` | Type/status |
| `num_episodes`, `start_date`, `end_date` | Counts and dates |
| `synopsis` | Description |
| `genres`, `studios` | Arrays of `{id, name}` (use `\|map:name` to get names) |
| `related_anime`, `related_manga` | Only when "Fetch related anime & manga" is on; each item has `node` (e.g. `node.title`) and `relation_type` |
| `mean`, `rank`, `popularity` | Stats |
| `watch_status`, `score`, `num_episodes_watched` | Your list status |
| `start_date_watched`, `finish_date_watched`, `comments`, `tags` | List details |

## Filters

| Filter | Example |
|--------|--------|
| **wikilink** | `{{title\|wikilink}}` → `[[Title]]`; arrays → `[[A]] [[B]]` |
| **join** | `{{genres\|map:name\|join:", "}}` → `Action, Comedy` |
| **default** | `{{ja_title\|default:—}}` → use `—` when empty |
| **lower**, **upper**, **title**, **capitalize** | Case conversion |
| **trim**, **snake**, **kebab**, **safe_name** | Normalize; `safe_name` for filenames |
| **first**, **last**, **nth** | Array elements |
| **map** | `{{genres\|map:name}}` → array of genre names |
| **list** | Array → markdown list lines |
| **blockquote**, **link** | Formatting |

## Example template (frontmatter + body)

```yaml
---
title: "{{title}}"
mal_id: {{id}}
media_type: {{media_type}}
status: {{status}}
score: {{score}}
watch_status: {{watch_status}}
genres: "{{genres|map:name|join:", "}}"
studios: "{{studios|map:name|wikilink}}"
---

# {{title}}

{{synopsis|default:No synopsis.}}
```

Save this as e.g. `Templates/Anime.md` and set **Anime template file** in plugin settings to that path. **Sync MAL anime lists** will create or update one note per anime using this template.
