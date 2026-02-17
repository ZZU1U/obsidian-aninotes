# AniNotes

*This plugin is not affiliated with or endorsed by AniList or Obsidian.*

> **⚠️ Development Status**: This plugin is in early alpha and may have bugs. If you encounter issues or have suggestions, please open an issue or submit a pull request.

AniNotes is an Obsidian plugin that synchronizes your local notes with metadata from AniList account, allowing you to keep your media tracking and note-taking in sync.

*This plugin is heavily inspired by the MyAnimeNotes plugin, which was unfortunately deleted by its original author.*

## 📦 Installation

Easiest way to install plugin is to use BRAT.
Other way would be to manually download the latest release from the releases page and place it in your obsidian plugins folder which is a pain.

## 📖 Usage

### Avaliable helpers (Jsonata filters)
- [x] capital
- [x] safename
- [x] wikilink
- [x] link
- [x] date (fuzzy date to YYYY-MM-DD)
- [x] callout
- [ ] blockquote
- [ ] image

### Templating

[Static AniList schema reference](https://docs.anilist.co/reference/query) for using in templates.

## 🙏 Acknowledgments

- Inspired by the original MyAnimeNotes plugin
- Built with [Obsidian API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- Uses [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/overview/graphql/getting-started)
- Template rendering powered by [Jsonata](https://jsonata.org)