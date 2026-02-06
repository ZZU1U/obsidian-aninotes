# AniNotes

**In the moment plugin isn't even really alpha, it works like shit and I know it. If you have any ideas or thoughts you want to share feel free to open issue or pr.**

*Plugin is heavily inspired by MyAnimeNotes plugin which was deleted by its author for unknown reasons.*

Basically what this plugin allows you to do is download all of your anilist anime and manga lists into obsidian notes which will have metadata from AL available for using in templates as well as your progress and notes on them. 
It will sync properties but won't change note content after creating it.

Intended use is to take more complex notes on manga or anime and reference them in your own notes.

AniList GrahpQL API is very flexible so it allows you to do lots of interesting stuff. For example if you fetch
relations to anime you can make links to prequels/sequels/adaptations/etc for quick navigation or structurization of your vault.

Simple example of relations template that can be used in note body:
```
{{#each media.relations.edges}}
- {{{capital this.relationType}}} [[{{{safename this.node.title.userPreferred}}} ({{{this.node.format}}}, {{{this.node.id}}})]]
{{/each}}
```