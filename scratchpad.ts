import {
    App,
    Plugin,
    PluginSettingTab,
    Setting,
    TFile,
    Notice,
    normalizePath,
    moment
  } from "obsidian";
  
  interface MalSyncSettings {
    clientId: string;
    accessToken: string;
    refreshToken: string;
    username: string;
    animeFolder: string;
    mangaFolder: string;
    animeTemplatePath: string;
    mangaTemplatePath: string;
    dateFormat: string;
  }
  
  const DEFAULT_SETTINGS: MalSyncSettings = {
    clientId: "",
    accessToken: "",
    refreshToken: "",
    username: "",
    animeFolder: "MAL/Anime",
    mangaFolder: "MAL/Manga",
    animeTemplatePath: "Templates/MAL Anime.md",
    mangaTemplatePath: "Templates/MAL Manga.md",
    dateFormat: "YYYY-MM-DD"
  };
  
  export default class MalSyncPlugin extends Plugin {
    settings: MalSyncSettings;
  
    async onload() {
      console.log("Loading MyAnimeList Sync plugin");
      await this.loadSettings();
  
      this.addSettingTab(new MalSyncSettingTab(this.app, this));
  
      this.addCommand({
        id: "mal-sync-anime",
        name: "Sync MAL Anime List",
        callback: () => this.syncMalList("anime")
      });
  
      this.addCommand({
        id: "mal-sync-manga",
        name: "Sync MAL Manga List",
        callback: () => this.syncMalList("manga")
      });
    }
  
    onunload() {
      console.log("Unloading MyAnimeList Sync plugin");
    }
  
    async loadSettings() {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
  
    async saveSettings() {
      await this.saveData(this.settings);
    }
  
    async syncMalList(type: "anime" | "manga") {
      try {
        if (!this.settings.username || !this.settings.clientId) {
          new Notice("MAL Sync: Please configure username and client ID in settings.");
          return;
        }
  
        // Ensure we have an access token. Implement your OAuth flow around this.
        if (!this.settings.accessToken) {
          new Notice("MAL Sync: No access token. Run OAuth flow in settings first.");
          return;
        }
  
        new Notice(`MAL Sync: Fetching ${type} list...`);
  
        const entries = await this.fetchMalList(type);
  
        if (!entries || entries.length === 0) {
          new Notice(`MAL Sync: No ${type} entries found.`);
          return;
        }
  
        const folder =
          type === "anime" ? this.settings.animeFolder : this.settings.mangaFolder;
        const templatePath =
          type === "anime"
            ? this.settings.animeTemplatePath
            : this.settings.mangaTemplatePath;
  
        const template = await this.loadTemplate(templatePath);
        if (!template) {
          new Notice(
            `MAL Sync: Template not found at "${templatePath}". Please create it.`
          );
          return;
        }
  
        const vault = this.app.vault;
        const folderPath = normalizePath(folder);
        await this.ensureFolder(folderPath);
  
        let created = 0;
        let updated = 0;
  
        for (const entry of entries) {
          const noteContent = this.renderTemplate(template, entry, type);
          const fileName = this.buildNoteFileName(entry, type);
          const filePath = normalizePath(`${folderPath}/${fileName}.md`);
  
          const existing = vault.getAbstractFileByPath(filePath);
          if (existing && existing instanceof TFile) {
            await vault.modify(existing, noteContent);
            updated++;
          } else {
            await vault.create(filePath, noteContent);
            created++;
          }
        }
  
        new Notice(
          `MAL Sync: ${type} sync complete. Created ${created}, updated ${updated} notes.`
        );
      } catch (e) {
        console.error(e);
        new Notice(`MAL Sync error: ${(e as Error).message}`);
      }
    }
  
    /**
     * Fetch MAL list (anime or manga) for the configured user.
     * This uses the official MAL v2 API shape; you MUST implement OAuth
     * to obtain and refresh accessToken/refreshToken.
     */
    private async fetchMalList(
      type: "anime" | "manga"
    ): Promise<MalEntry[]> {
      const { username, accessToken } = this.settings;
  
      // Example endpoint:
      // Anime: https://api.myanimelist.net/v2/users/{username}/animelist
      // Manga: https://api.myanimelist.net/v2/users/{username}/mangalist
      const listType = type === "anime" ? "animelist" : "mangalist";
  
      const url = new URL(
        `https://api.myanimelist.net/v2/users/${encodeURIComponent(
          username
        )}/${listType}`
      );
      // Customize fields as needed
      url.searchParams.set(
        "fields",
        [
          "id",
          "title",
          "alternative_titles",
          "mean",
          "rank",
          "popularity",
          "num_episodes",
          "num_volumes",
          "num_chapters",
          "status",
          "media_type",
          "genres",
          "start_date",
          "end_date",
          "synopsis",
          "my_list_status",
          "studios",
          "authors",
          "nsfw"
        ].join(",")
      );
      url.searchParams.set("limit", "1000"); // adjust as needed
  
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
  
      if (!res.ok) {
        if (res.status === 401) {
          // Token expired, you should handle refresh here.
          throw new Error("Unauthorized / token expired. Please refresh OAuth.");
        }
        throw new Error(`MAL API error ${res.status}: ${res.statusText}`);
      }
  
      const json = await res.json();
      // MAL returns { data: [ { node: {...}, list_status: {...} }, ... ] }
      const entries: MalEntry[] = (json.data ?? []).map((item: any) =>
        this.normalizeMalEntry(item, type)
      );
      return entries;
    }
  
    private normalizeMalEntry(raw: any, type: "anime" | "manga"): MalEntry {
      const n = raw.node ?? {};
      const listStatus = raw.list_status ?? raw.my_list_status ?? {};
  
      return {
        id: n.id,
        type,
        title: n.title,
        alternativeTitles: n.alternative_titles ?? {},
        meanScore: n.mean ?? null,
        rank: n.rank ?? null,
        popularity: n.popularity ?? null,
        episodes: n.num_episodes ?? null,
        volumes: n.num_volumes ?? null,
        chapters: n.num_chapters ?? null,
        status: n.status ?? "",
        mediaType: n.media_type ?? "",
        genres: (n.genres ?? []).map((g: any) => g.name),
        startDate: n.start_date ?? null,
        endDate: n.end_date ?? null,
        synopsis: n.synopsis ?? "",
        nsfw: n.nsfw ?? "white",
        listStatus: listStatus.status ?? "",
        listScore: listStatus.score ?? null,
        listProgress: listStatus.num_episodes ?? listStatus.num_chapters ?? null,
        listStartDate: listStatus.start_date ?? null,
        listFinishDate: listStatus.finish_date ?? null,
        raw
      };
    }
  
    private async loadTemplate(path: string): Promise<string | null> {
      const normalized = normalizePath(path);
      const file = this.app.vault.getAbstractFileByPath(normalized);
      if (file && file instanceof TFile) {
        return this.app.vault.read(file);
      }
      return null;
    }
  
    private async ensureFolder(folderPath: string) {
      const vault = this.app.vault;
      const folder = vault.getAbstractFileByPath(folderPath);
      if (!folder) {
        await vault.createFolder(folderPath);
      }
    }
  
    private buildNoteFileName(entry: MalEntry, type: "anime" | "manga"): string {
      // Simple: "Title (MAL #12345)" – adjust to preference
      const safeTitle = entry.title.replace(/[\/\\:*?"<>|]/g, "_");
      return `${safeTitle} (MAL ${type === "anime" ? "Anime" : "Manga"} #${entry.id})`;
    }
  
    private renderTemplate(
      template: string,
      entry: MalEntry,
      type: "anime" | "manga"
    ): string {
      const dateFormat = this.settings.dateFormat || "YYYY-MM-DD";
  
      const replacements: Record<string, string> = {
        "{{mal_id}}": String(entry.id),
        "{{type}}": type,
        "{{title}}": entry.title ?? "",
        "{{alternative_titles.english}}":
          entry.alternativeTitles?.en ?? entry.alternativeTitles?.english ?? "",
        "{{alternative_titles.japanese}}":
          entry.alternativeTitles?.ja ?? entry.alternativeTitles?.japanese ?? "",
        "{{mean_score}}": entry.meanScore != null ? String(entry.meanScore) : "",
        "{{rank}}": entry.rank != null ? String(entry.rank) : "",
        "{{popularity}}": entry.popularity != null ? String(entry.popularity) : "",
        "{{episodes}}": entry.episodes != null ? String(entry.episodes) : "",
        "{{volumes}}": entry.volumes != null ? String(entry.volumes) : "",
        "{{chapters}}": entry.chapters != null ? String(entry.chapters) : "",
        "{{status}}": entry.status ?? "",
        "{{media_type}}": entry.mediaType ?? "",
        "{{genres}}": (entry.genres ?? []).join(", "),
        "{{start_date}}": this.formatDate(entry.startDate, dateFormat),
        "{{end_date}}": this.formatDate(entry.endDate, dateFormat),
        "{{synopsis}}": entry.synopsis ?? "",
        "{{nsfw}}": entry.nsfw ?? "",
        "{{list_status}}": entry.listStatus ?? "",
        "{{list_score}}":
          entry.listScore != null ? String(entry.listScore) : "",
        "{{list_progress}}":
          entry.listProgress != null ? String(entry.listProgress) : "",
        "{{list_start_date}}": this.formatDate(
          entry.listStartDate,
          dateFormat
        ),
        "{{list_finish_date}}": this.formatDate(
          entry.listFinishDate,
          dateFormat
        ),
        "{{last_sync}}": moment().format(dateFormat)
      };
  
      let output = template;
      for (const [key, value] of Object.entries(replacements)) {
        output = output.replaceAll(key, value);
      }
  
      return output;
    }
  
    private formatDate(dateStr: string | null, fmt: string): string {
      if (!dateStr) return "";
      return moment(dateStr).format(fmt);
    }
  }
  
  interface MalEntry {
    id: number;
    type: "anime" | "manga";
    title: string;
    alternativeTitles?: Record<string, string>;
    meanScore: number | null;
    rank: number | null;
    popularity: number | null;
    episodes: number | null;
    volumes: number | null;
    chapters: number | null;
    status: string;
    mediaType: string;
    genres: string[];
    startDate: string | null;
    endDate: string | null;
    synopsis: string;
    nsfw: string;
    listStatus: string;
    listScore: number | null;
    listProgress: number | null;
    listStartDate: string | null;
    listFinishDate: string | null;
    raw: any;
  }
  
  class MalSyncSettingTab extends PluginSettingTab {
    plugin: MalSyncPlugin;
  
    constructor(app: App, plugin: MalSyncPlugin) {
      super(app, plugin);
      this.plugin = plugin;
    }
  
    display(): void {
      const { containerEl } = this;
      containerEl.empty();
  
      containerEl.createEl("h2", { text: "MyAnimeList Sync Settings" });
  
      new Setting(containerEl)
        .setName("MAL Client ID")
        .setDesc(
          "Register an application on MyAnimeList and paste its Client ID here."
        )
        .addText((text) =>
          text
            .setPlaceholder("Client ID")
            .setValue(this.plugin.settings.clientId)
            .onChange(async (value) => {
              this.plugin.settings.clientId = value.trim();
              await this.plugin.saveSettings();
            })
        );
  
      new Setting(containerEl)
        .setName("MAL Username")
        .setDesc("Your MyAnimeList username.")
        .addText((text) =>
          text
            .setPlaceholder("Username")
            .setValue(this.plugin.settings.username)
            .onChange(async (value) => {
              this.plugin.settings.username = value.trim();
              await this.plugin.saveSettings();
            })
        );
  
      containerEl.createEl("h3", { text: "OAuth Tokens (Advanced)" });
  
      new Setting(containerEl)
        .setName("Access Token")
        .setDesc(
          "Access token obtained via OAuth. In a full implementation this is set automatically."
        )
        .addText((text) =>
          text
            .setPlaceholder("Access token")
            .setValue(this.plugin.settings.accessToken)
            .onChange(async (value) => {
              this.plugin.settings.accessToken = value.trim();
              await this.plugin.saveSettings();
            })
        );
  
      new Setting(containerEl)
        .setName("Refresh Token")
        .setDesc("Refresh token obtained via OAuth.")
        .addText((text) =>
          text
            .setPlaceholder("Refresh token")
            .setValue(this.plugin.settings.refreshToken)
            .onChange(async (value) => {
              this.plugin.settings.refreshToken = value.trim();
              await this.plugin.saveSettings();
            })
        );
  
      containerEl.createEl("h3", { text: "Folders & Templates" });
  
      new Setting(containerEl)
        .setName("Anime notes folder")
        .setDesc("Folder where anime notes will be created.")
        .addText((text) =>
          text
            .setPlaceholder("MAL/Anime")
            .setValue(this.plugin.settings.animeFolder)
            .onChange(async (value) => {
              this.plugin.settings.animeFolder = value.trim();
              await this.plugin.saveSettings();
            })
        );
  
      new Setting(containerEl)
        .setName("Manga notes folder")
        .setDesc("Folder where manga notes will be created.")
        .addText((text) =>
          text
            .setPlaceholder("MAL/Manga")
            .setValue(this.plugin.settings.mangaFolder)
            .onChange(async (value) => {
              this.plugin.settings.mangaFolder = value.trim();
              await this.plugin.saveSettings();
            })
        );
  
      new Setting(containerEl)
        .setName("Anime template path")
        .setDesc("Path to the anime note template.")
        .addText((text) =>
          text
            .setPlaceholder("Templates/MAL Anime.md")
            .setValue(this.plugin.settings.animeTemplatePath)
            .onChange(async (value) => {
              this.plugin.settings.animeTemplatePath = value.trim();
              await this.plugin.saveSettings();
            })
        );
  
      new Setting(containerEl)
        .setName("Manga template path")
        .setDesc("Path to the manga note template.")
        .addText((text) =>
          text
            .setPlaceholder("Templates/MAL Manga.md")
            .setValue(this.plugin.settings.mangaTemplatePath)
            .onChange(async (value) => {
              this.plugin.settings.mangaTemplatePath = value.trim();
              await this.plugin.saveSettings();
            })
        );
  
      new Setting(containerEl)
        .setName("Date format")
        .setDesc("Moment.js format string used for dates.")
        .addText((text) =>
          text
            .setPlaceholder("YYYY-MM-DD")
            .setValue(this.plugin.settings.dateFormat)
            .onChange(async (value) => {
              this.plugin.settings.dateFormat = value.trim() || "YYYY-MM-DD";
              await this.plugin.saveSettings();
            })
        );
    }
  }