import { Notice, ObsidianProtocolData, Plugin, TFile } from "obsidian";
import { MANSettings, SettingTab } from "./settings";
import { serviceAuth, updateToken } from "api/auth";
import { OAuthDataSchema } from "models/auth";
import { getUserInfo } from "user";
import { UserAnimeListItem } from "models/anime";
import { getUserAnimeList, enrichUserAnimeListWithDetails } from "api/anime";
import { renderTemplate, animeTemplateContext, buildFrontmatterFromEntries, buildNoteContent } from "template";
import { DEFAULT_SETTINGS } from "./constant";


export default class MANPlugin extends Plugin {
	settings: MANSettings;
	OAuthURLData: OAuthDataSchema | undefined = undefined;

	async onload() {
		await this.loadSettings();
		this.addCommand({
			id: 'refresh-token',
			name: 'Update access token',
			callback: async () => {
				if (!this.settings.refreshToken) {
					new Notice("Refresh failed: no refresh token")
					return;
				}

				const token = await updateToken(this.settings.refreshToken);

				if (!token) {
					new Notice("Refresh failed: no token received")
					return;
				}

				this.settings.accessToken = token.access_token;
				this.settings.refreshToken = token.refresh_token;
				await this.saveSettings()

				new Notice("Tokens updated")
			}
		});

		this.addCommand({
			id: "sync-anime-library",
			name: "Sync anime lists",
			callback: async () => {
				if (!this.settings.accessToken) {
					new Notice("Not authenticated. Connect account in settings.");
					return;
				}
				const list = await getUserAnimeList(this.settings.accessToken);
				if (!list?.data.length) {
					new Notice("No anime list or list is empty.");
					return;
				}
				let data = list.data;
				if (this.settings.fetchRelatedAnimeManga) {
					new Notice("Fetching related anime/manga for each entry…");
					data = await enrichUserAnimeListWithDetails(data, this.settings.accessToken, { delayMs: 250 });
				}
				await this.updateAnimeFiles(data);
			},
		});

		this.addCommand({
			id: 'sync-user-info',
			name: 'Sync basic user info',
			callback: async () => {
				const userData = await getUserInfo(this.settings.accessToken);
				this.settings.clientId = userData?.id.toString() || "";
				this.settings.username = userData?.name || "";
			}
		});

		this.addSettingTab(new SettingTab(this.app, this));
		//this.addSettingTab(new AnimeNoteSettingTab(this.app, this));

		this.registerObsidianProtocolHandler(
			'man-revive-sync/mal',
			async (params: ObsidianProtocolData) => {
				const code = params?.code;
				const state = params?.state;

				if (!code) {
					new Notice("Bad auth: no code returned");
					return;
				}
				if (!this.OAuthURLData) {
					new Notice("Bad auth: no auth data created");
					return;
				}
				if (state !== this.OAuthURLData.state) {
					new Notice("Bad auth: expired state");
					return;
				}
				
				const token = await serviceAuth(this.OAuthURLData, code);

				if (!token) {
					new Notice("Bad auth: auth failed");
				} else {
					this.OAuthURLData = undefined;
					this.settings.accessToken = token.access_token;
					this.settings.refreshToken = token.refresh_token;
					await this.saveSettings()
					new Notice("Auth completed");
				}
			}
		)
	}

	onunload() {
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<MANSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		// if (!Array.isArray(this.settings.animeNoteT.frontMatterT) || this.settings.animeNoteT.frontMatterT.length === 0) {
		// 	this.settings.animeFrontmatter = [...DEFAULT_SETTINGS.animeFrontmatter];
		// }
		// if (this.settings.animeBodyTemplate === undefined || this.settings.animeBodyTemplate === null) {
		// 	this.settings.animeBodyTemplate = DEFAULT_SETTINGS.animeBodyTemplate;
		// }
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async updateAnimeFiles(animeList: UserAnimeListItem[]) {
		const entries = this.settings.animeNoteT.frontMatterT;
		const bodyTemplate = this.settings.animeNoteT.noteBodyT;
		let updated = 0;

		for (const item of animeList) {
			const context = animeTemplateContext(item); // as Record<string, unknown>; #TODO
			//console.log(context);
			const notePath = renderTemplate(this.settings.animeNoteT.fileNameT, context).trim();
			if (!notePath.endsWith(".md")) continue;

			const frontmatter = buildFrontmatterFromEntries(entries, context, renderTemplate);
			const body = renderTemplate(bodyTemplate, context);
			const content = buildNoteContent(frontmatter, body);

			const existing = this.app.vault.getAbstractFileByPath(notePath);
			if (existing && existing instanceof TFile) {
				await this.app.vault.modify(existing, content);
			} else {
				await this.app.vault.create(notePath, content);
			}
			updated++;
		}
		new Notice(`Synced ${updated} anime notes.`);
	}
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
