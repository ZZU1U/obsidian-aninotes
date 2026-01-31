import { App, PluginSettingTab, Setting } from "obsidian";
import MANPlugin from "./main";
import { createOAuthURL, openInBrowser } from "api/auth";
//import { OAuthDataSchema } from "models/auth";
import type { FrontmatterEntry } from "./template";
import { NoteTemplateSettings } from "template/models";

export type { FrontmatterEntry };

export interface MANSettings {
	clientId: string;
	accessToken: string;
	refreshToken: string;
	username: string;
	animeNoteT: NoteTemplateSettings,
	mangaNoteT: NoteTemplateSettings,
	dateFormat: string;
	fetchRelatedAnimeManga: boolean;
	syncOnStartup: boolean;
	startupDelay: number;
	backgroundSync: boolean;
	backgroundSyncInterval: number;
}

type SettingsTabId = "general" | "anime" | "manga" | "experimental";

export class SettingTab extends PluginSettingTab {
	plugin: MANPlugin;
	private activeTab: SettingsTabId = "general";

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

	private renderGeneral(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Connect account") //.setDesc("Authenticate with oauth")
			.addButton(btn => {
				btn
					.setButtonText("Connect")
					.setCta()
					.onClick(() => {
						const authUrl = createOAuthURL();
						this.plugin.OAuthURLData = authUrl;
						openInBrowser(authUrl.url);
					});
			});

		new Setting(containerEl)
			.setName("Account name")
			.setDesc("Name of connected account")
			.addText((el) => {
				el.setValue(this.plugin.settings.username);
			});

		// new Setting(containerEl)
		// 	.setName("Anime note path template")
		// 	.setDesc("Path for each anime note. Use {{title}}, {{media_type}}, {{title|safe_name}}, etc.")
		// 	.addText((el) => {
		// 		el.setValue(this.plugin.settings.animeNoteT.fileNameT);
		// 		el.onChange((value) => {
		// 			this.plugin.settings.animeNoteT.fileNameT = value.trim();
		// 			this.plugin.saveSettings();
		// 		});
		// 	});

	}

	private renderAnime(containerEl: HTMLElement) {
		new Setting(containerEl).setName("Anime note").setHeading()
		//containerEl.createEl("h2", { text: "Anime note" });
		containerEl.createEl("p", {
			text: "Define one frontmatter property per row. Value uses {{variable}} and {{variable|filter}} (e.g. {{title}}, {{genres|map:name|lines}}). Type: Text = single value, List = newline-separated values become a YAML list.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("Note path")
			.setDesc("Name of note about anime series")
			.addText((el) => {
				el
					.setValue(this.plugin.settings.animeNoteT.fileNameT)
					.setPlaceholder("MAL/Anime/{{title}}.md")
					.onChange(async (value) => {
						this.plugin.settings.animeNoteT.fileNameT = value;
						await this.plugin.saveSettings();
					});
				el.inputEl.setCssProps({flex: "1", minWidth: "200px"})
			});

		const list = this.plugin.settings.animeNoteT.frontMatterT;
		for (let i = 0; i < list.length; i++) {
			const entry = list[i];
			if (!entry) continue;
			const row = containerEl.createDiv({ cls: "man-frontmatter-row" });
			new Setting(row)
				.addText((text) => {
					text
						.setPlaceholder("Property name")
						.setValue(entry.key)
						.onChange(async (value) => {
							entry.key = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.setCssProps({minWidth: "120px"});
					//(text as unknown as { inputEl: HTMLInputElement }).inputEl.style.minWidth = "120px";
				})
				.addText((text) => {
					text
						.setPlaceholder("{{title}} or {{genres|map:name|lines}}")
						.setValue(entry.value)
						.onChange(async (value) => {
							entry.value = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.setCssProps({flex: "1", minWidth: "180px"});
				})
				.addDropdown((drop) => {
					drop
						.addOption("text", "Text")
						.addOption("list", "List")
						.addOption("number", "Number")
						.addOption("checkbox", "Checkbox")
						.addOption("date", "Date")
						.addOption("datetime", "Date & time")
						.setValue(entry.type)
						.onChange(async (value: "text" | "list" | "number" | "checkbox" | "date" | "datetime") => {
							entry.type = value;
							await this.plugin.saveSettings();
						});
				})
				.addButton((btn) => {
					btn.setButtonText("Remove").onClick(async () => {
						this.plugin.settings.animeNoteT.frontMatterT.splice(i, 1);
						await this.plugin.saveSettings();
						this.display();
					});
				});
		}

		new Setting(containerEl).addButton((btn) => {
			btn.setButtonText("Add property").onClick(async () => {
				this.plugin.settings.animeNoteT.frontMatterT.push({
					key: "",
					value: "{{}}",
					type: "text",
				});
				await this.plugin.saveSettings();
				this.display();
			});
		});

		new Setting(containerEl)
			.setName("Note body template")
			.setHeading();
		containerEl.createEl("p", {
			text: "Multiline template for the note body (below frontmatter). Same {{variable|filter}} syntax.",
			cls: "setting-item-description",
		});
		new Setting(containerEl)
			.setClass("man-body-template")
			.addTextArea((ta) => {
				ta
					.setPlaceholder("{{synopsis|default:}}\n\n# {{title}}")
					.setValue(this.plugin.settings.animeNoteT.noteBodyT)
					.onChange(async (value) => {
						this.plugin.settings.animeNoteT.noteBodyT = value;
						await this.plugin.saveSettings();
					});
				ta.inputEl.rows = 6;
				ta.inputEl.setCssProps({width: "100%"})
			});
	}

	private renderManga(containerEl: HTMLElement) {

	}

	private renderExperimental(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Experimental")
			.setHeading();

		containerEl.createEl("p", {
			text: "These settings include behaviour which is currentl under development. \
				It is highly recommended to leave these settings as is because their behaviour is unpredictable.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("Fetch related anime & manga")
			.setDesc("When syncing, fetch related_anime and related_manga for each entry (one API request per anime; slower).")
			.addToggle((el) => {
				el.setValue(this.plugin.settings.fetchRelatedAnimeManga);
				el.onChange(async (value) => {
					this.plugin.settings.fetchRelatedAnimeManga = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
