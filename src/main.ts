import { Notice, ObsidianProtocolData, Plugin, TFile } from "obsidian";
import { MANSettings, SettingTab } from "./settings";
import { ALOAuthDataSchema } from "models/auth";
//import { renderTemplate, animeTemplateContext, buildFrontmatterFromEntries, buildNoteContent } from "template";
import { DEFAULT_SETTINGS } from "./constant";
import { exchangeALCode, getUserInfo } from "api/auth";
import {
	syncUserAnimeList
} from "commands"


export default class MANPlugin extends Plugin {
	settings: MANSettings;
	ALOAuthURLData?: ALOAuthDataSchema  = undefined;
	settingsTab?: SettingTab = undefined;

	private syncUserAnimeList = syncUserAnimeList;

	async onload() {
		await this.loadSettings();
		// this.addCommand({
		// 	id: "sync-anime-library",
		// 	name: "Sync anime lists",
		// 	callback: async () => {
		// 		if (!this.settings.accessToken) {
		// 			new Notice("Not authenticated. Connect account in settings.");
		// 			return;
		// 		}
		// 		const list = await getUserAnimeList(this.settings.accessToken);
		// 		if (!list?.data.length) {
		// 			new Notice("No anime list or list is empty.");
		// 			return;
		// 		}
		// 		let data = list.data;
		// 		if (this.settings.fetchRelatedAnimeManga) {
		// 			new Notice("Fetching related anime/manga for each entry…");
		// 			data = await enrichUserAnimeListWithDetails(data, this.settings.accessToken, { delayMs: 250 });
		// 		}
		// 		await this.updateAnimeFiles(data);
		// 	},
		// });

		// this.addCommand({
		// 	id: "sync-anime-library",
		// 	name: "Sync anime lists",
		// 	callback: async () => {
		// 		if (this.settings.preferedAPI === 'anilist') {
		// 			if (!this.settings.tokenAL) {
		// 				new Notice("Log in first");
		// 				return;
		// 			}

		// 			await getUserAnimeList(this.settings.tokenAL.access_token);
		// 		}
		// 	},
		// });
		this.addCommand({
			id: 'test',
			name: 'Test engine',
			callback: async () => {
				// Template engine test placeholder
			}
		});

		this.addCommand({
			id: 'sync-anime-list',
			name: 'Sync user anime list',
			callback: async () => {
				await this.syncUserAnimeList();
			}
		});

		this.settingsTab = new SettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);
		//this.addSettingTab(new AnimeNoteSettingTab(this.app, this));

		// this.registerObsidianProtocolHandler(
		// 	'man-revive-sync/mal',
		// 	async (params: ObsidianProtocolData) => {
		// 		const code = params?.code;
		// 		const state = params?.state;

		// 		if (!code) {
		// 			new Notice("Bad auth: no code returned");
		// 			return;
		// 		}
		// 		if (!this.OAuthURLData) {
		// 			new Notice("Bad auth: no auth data created");
		// 			return;
		// 		}
		// 		if (state !== this.OAuthURLData.state) {
		// 			new Notice("Bad auth: expired state");
		// 			return;
		// 		}
				
		// 		const token = await serviceAuth(this.OAuthURLData, code);

		// 		if (!token) {
		// 			new Notice("Bad auth: auth failed");
		// 		} else {
		// 			this.OAuthURLData = undefined;
		// 			this.settings.accessToken = token.access_token;
		// 			this.settings.refreshToken = token.refresh_token;
		// 			await this.saveSettings()
		// 			new Notice("Auth completed");
		// 		}
		// 	}
		// )

		this.registerObsidianProtocolHandler(
			'man-revive-sync/al',
			async (params: ObsidianProtocolData) => {
				const code = params?.code;

				if (!code) {
					new Notice("Bad auth: no code returned");
					return;
				}
				
				const token = await exchangeALCode(code);

				if (!token) {
					new Notice("Bad auth: no token returned");
					return;
				}

				this.settings.tokenAL = token;
				await this.saveSettings();
			}
		)
	}

	onunload() {
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<MANSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async updateALProfile() {
		this.settingsTab?.accountAL?.setDesc("Updating...");

		if (!this.settings.tokenAL) {
			new Notice("Anilist account is not logged in");
			return;
		}

		const user = await getUserInfo(this.settings.tokenAL.access_token);

		if (!user) {
			new Notice("User info update failed");
			return;
		}

		this.settings.accountALInfo = user;
		await this.saveSettings();

		if (this.settingsTab && this.settingsTab.accountAL) {
			this.settingsTab.accountAL.setDesc(`User: ${user.name}; id: ${user.id}`);
		}
	}

	// async updateAnimeFiles(animeList: UserAnimeListItem[]) {
	// 	const entries = this.settings.animeNoteT.frontMatterT;
	// 	const bodyTemplate = this.settings.animeNoteT.noteBodyT;
	// 	let updated = 0;

	// 	for (const item of animeList) {
	// 		const context = animeTemplateContext(item); // as Record<string, unknown>; #TODO
	// 		//console.log(context);
	// 		const notePath = renderTemplate(this.settings.animeNoteT.fileNameT, context).trim();
	// 		if (!notePath.endsWith(".md")) continue;

	// 		const frontmatter = buildFrontmatterFromEntries(entries, context, renderTemplate);
	// 		const body = renderTemplate(bodyTemplate, context);
	// 		const content = buildNoteContent(frontmatter, body);

	// 		const existing = this.app.vault.getAbstractFileByPath(notePath);
	// 		if (existing && existing instanceof TFile) {
	// 			await this.app.vault.modify(existing, content);
	// 		} else {
	// 			await this.app.vault.create(notePath, content);
	// 		}
	// 		updated++;
	// 	}
	// 	new Notice(`Synced ${updated} anime notes.`);
	// }
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		let {contentEl} = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }
