# AniNotes

> **⚠️ Development Status**: This plugin is in early alpha and may have bugs. If you encounter issues or have suggestions, please open an issue or submit a pull request.

AniNotes is an Obsidian plugin that synchronizes your AniList anime and manga lists with your Obsidian vault, creating rich, metadata-powered notes for your media tracking and note-taking needs.

*This plugin is heavily inspired by the MyAnimeNotes plugin, which was unfortunately deleted by its original author.*

## 🚀 Features

- **Automatic Sync**: Download your complete AniList anime and manga lists directly into Obsidian
- **Rich Metadata**: Access comprehensive AniList metadata for use in templates and queries
- **Progress Tracking**: Sync your watching/reading progress and scores
- **Custom Templates**: Use Handlebars templates to customize note creation
- **Relations Support**: Automatically link to prequels, sequels, adaptations, and other related media
- **Property Sync**: Keep your note properties in sync with AniList data
- **Vault Integration**: Reference your media notes in other Obsidian notes using standard wiki links

## 📦 Installation

### Method 1: Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings → Community Plugins
2. Browse for "AniNotes" or search for "obsidian-aninotes"
3. Click Install and then Enable

### Method 2: Manual Installation
1. Download the latest release from the [Releases page](https://github.com/zzu1u/obsidian-aninotes/releases)
2. Extract the downloaded ZIP file
3. Move the extracted folder to `<your-vault>/.obsidian/plugins/`
4. Rename the folder to `obsidian-aninotes` if needed
5. Enable the plugin in Obsidian Settings → Community Plugins

## ⚙️ Configuration

### Initial Setup
1. After installing, open AniNotes settings in Obsidian Settings → Community Plugins → AniNotes
2. Enter your AniList username
3. Configure your preferred sync settings:
   - Sync frequency (manual, daily, weekly)
   - Note folder location
   - Template customization
   - Metadata fields to include

### Template Customization
AniNotes uses Handlebars templates for note creation. You can customize:
- Note structure and layout
- Which metadata fields to include
- How relations are displayed
- Custom properties and formatting

## 📖 Usage

### Basic Usage
1. **Initial Sync**: Use the "Sync All" command to download your entire AniList
2. **Manual Updates**: Use "Sync Changes" to update only modified entries
3. **Individual Sync**: Right-click on specific entries to sync them individually

<!-- TODO: Add screenshots showing:
- Plugin settings interface
- Example of synced anime/manga notes
- Template customization interface
- Command palette usage
-->

### Template Examples

#### Relations Template
Create automatic links to related media:
```handlebars
{{#each media.relations.edges}}
- {{{capital this.relationType}}} [[{{{safename this.node.title.userPreferred}}} ({{{this.node.format}}}, {{{this.node.id}}})]]
{{/each}}
```

#### Basic Media Template
```handlebars
# {{{media.title.userPreferred}}}

**Format**: {{{media.format}}}  
**Status**: {{{media.status}}}  
**Episodes**: {{{media.episodes}}}  
**Score**: {{{userMedia.score}}}/10  
**Progress**: {{{userMedia.progress}}}/{{{media.episodes}}}

## Synopsis
{{{media.description}}}

## Relations
{{#each media.relations.edges}}
- {{{capital this.relationType}}} [[{{{safename this.node.title.userPreferred}}}]]
{{/each}}
```

## 🔧 Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/zzu1u/obsidian-aninotes.git
cd obsidian-aninotes

# Install dependencies
npm install

# Development mode (watch for changes)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Project Structure
- `src/main.ts` - Main plugin entry point
- `src/api/` - AniList GraphQL API integration
- `src/settings/` - Plugin configuration and UI
- `src/template/` - Handlebars template processing
- `src/models/` - TypeScript interfaces and types

## 🤝 Contributing

Contributions are welcome! Please feel free to:
- Report bugs via [GitHub Issues](https://github.com/zzu1u/obsidian-aninotes/issues)
- Submit pull requests for new features or bug fixes
- Suggest improvements to templates or documentation
- Share your custom templates and use cases

## 📄 License

This project is licensed under the 0-BSD License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the original MyAnimeNotes plugin
- Built with [Obsidian API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- Uses [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/overview/graphql/getting-started)
- Template rendering powered by [Handlebars.js](https://handlebarsjs.com/)

---

**Note**: This plugin is not affiliated with or endorsed by AniList or Obsidian.