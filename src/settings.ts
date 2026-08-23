import { PluginSettingTab } from "obsidian";
import type { App, Setting } from "obsidian";
import type AniNotesPlugin from "./main";
import type { OAuthTokenSchema } from "./models/auth";
import type { NoteTemplateSettings } from "./template/models";
import type { FetchOptions } from "./api/common";
import type { AutoSyncIntervalMode } from "./constant";
import { renderGeneral } from "./settings/general";
import { renderMediaNoteSettings } from "./settings/media-notes";
import { renderExperimental } from "./settings/experimental";
import { renderLog } from "./settings/log";

export interface AniNotesSettings {
	tokenAL?: OAuthTokenSchema;
	animeNoteT: NoteTemplateSettings;
	mangaNoteT: NoteTemplateSettings;
	fetchUserDataAtStartup: boolean;
	accountALInfo?: {
		id: number;
		name: string;
	};
	apiFetchOptions: FetchOptions;
	useCustomAnimeRequest: boolean;
	useCustomMangaRequest: boolean;
	customMangaRequest: string;
	customAnimeRequest: string;
	allowUserNoteNames: boolean;
	autoSyncOnStartup: boolean;
	autoSyncInterval: AutoSyncIntervalMode;
	/** Minutes between background syncs; used when autoSyncInterval is "custom". */
	autoSyncCustomInterval: number;
	notifyOnSync: boolean;
}

type SettingsTabId = "general" | "anime" | "manga" | "experimental" | "log";

export class SettingTab extends PluginSettingTab {
	plugin: AniNotesPlugin;
	private activeTab: SettingsTabId = "general";
	accountAL?: Setting = undefined;

	constructor(app: App, plugin: AniNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const tabBar = containerEl.createDiv("aninotes-tabs");

		const tabs: Array<[SettingsTabId, string]> = [
			["general", "General"],
			["anime", "Anime"],
			["manga", "Manga"],
			["experimental", "Experimental"],
			["log", "Log"],
		];

		for (const [id, label] of tabs) {
			const btn = tabBar.createEl("button", { text: label });
			btn.classList.toggle("is-active", this.activeTab === id);
			btn.onclick = () => {
				this.activeTab = id;
				this.display();
			};
		}

		containerEl.createEl("hr").setCssProps({
			margin: "8px 0",
		});

		switch (this.activeTab) {
			case "general":
				renderGeneral.call(this, containerEl);
				break;
			case "anime":
				renderMediaNoteSettings.call(this, containerEl, "anime");
				break;
			case "manga":
				renderMediaNoteSettings.call(this, containerEl, "manga");
				break;
			case "experimental":
				renderExperimental.call(this, containerEl);
				break;
			case "log":
				renderLog.call(this, containerEl);
				break;
		}
	}
}
