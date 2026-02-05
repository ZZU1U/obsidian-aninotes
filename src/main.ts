import { Notice, ObsidianProtocolData, Plugin } from "obsidian";
import { MANSettings, SettingTab } from "./settings";
import { ALOAuthDataSchema } from "models/auth";
//import { renderTemplate, animeTemplateContext, buildFrontmatterFromEntries, buildNoteContent } from "template";
import { DEFAULT_SETTINGS } from "./constant";
import { exchangeALCode, getUserInfo } from "api/auth";
import {
	syncUserAnimeList,
	syncUserMangaList
} from "commands"


export default class MANPlugin extends Plugin {
	settings: MANSettings;
	ALOAuthURLData?: ALOAuthDataSchema  = undefined;
	settingsTab?: SettingTab = undefined;

	private syncUserAnimeList = syncUserAnimeList;
	private syncUserMangaList = syncUserMangaList;

	async onload() {
		await this.loadSettings();
		this.addCommand({
			id: 'sync-anime-list',
			name: 'Sync user anime list',
			callback: async () => {
				await this.syncUserAnimeList();
			}
		});

		this.addCommand({
			id: 'sync-manga-list',
			name: 'Sync user manga list',
			callback: async () => {
				await this.syncUserMangaList();
			}
		});

		this.addCommand({
			id: 'sync-all-lists',
			name: 'Sync all',
			callback: async () => {
				await this.syncUserAnimeList();
				await this.syncUserMangaList();
			}
		})

		this.settingsTab = new SettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);

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
