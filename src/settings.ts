import { App, PluginSettingTab, Setting } from "obsidian";
import MANPlugin from "./main";
import { OAuthTokenSchema } from "models/auth";
import { FrontmatterEntry, NoteTemplateSettings } from "./template/models";
import { renderGeneral } from "./settings/general";
import { renderAnime } from "./settings/anime";
import { renderManga } from "./settings/manga";
import { renderExperimental } from "./settings/experimental";
import { FetchOptions } from "api/common";

export type { FrontmatterEntry };

export interface MANSettings {
	tokenAL?: OAuthTokenSchema,
	animeNoteT: NoteTemplateSettings,
	mangaNoteT: NoteTemplateSettings,
	dateFormat: string;
	syncOnStartup: boolean;
	startupDelay: number;
	backgroundSync: boolean;
	fetchUserDataAtStartup: boolean;
	backgroundSyncInterval: number;
	accountALInfo?: {
		id: number,
		name: string
	},
	apiFetchOptions: FetchOptions
}

type SettingsTabId = "general" | "anime" | "manga" | "experimental";

export class SettingTab extends PluginSettingTab {
	plugin: MANPlugin;
	private activeTab: SettingsTabId = "general";
	accountAL?: Setting = undefined;

	constructor(app: App, plugin: MANPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		const tabBar = containerEl.createDiv("my-plugin-tabs");

		const createTab = (id: SettingsTabId, label: string) => {
			const btn = tabBar.createEl("button", { text: label });
			btn.classList.toggle("is-active", this.activeTab === id);
			btn.onclick = () => {
				this.activeTab = id;
				this.display();
			};
		};

		createTab("general", "General");
		createTab("anime", "Anime");
		createTab("manga", "Manga");
		createTab("experimental", "Experimental");

		containerEl.createEl("hr");

		// Content
		if (this.activeTab === "general") {
			this.renderGeneral(containerEl);
		}
		if (this.activeTab === "anime") {
			this.renderAnime(containerEl);
		}
		if (this.activeTab === "manga") {
			this.renderManga(containerEl);
		}
		if (this.activeTab === "experimental") {
			this.renderExperimental(containerEl);
		}

	}

	private renderGeneral = renderGeneral;
	private renderAnime = renderAnime;
	private renderManga = renderManga;
	private renderExperimental = renderExperimental;
}
