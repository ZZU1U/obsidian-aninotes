/* eslint-disable obsidianmd/ui/sentence-case */
import { Setting } from "obsidian";
import type { SettingTab } from "../settings";

export function renderAnime(this: SettingTab, containerEl: HTMLElement) {
	new Setting(containerEl).setName("Anime note tab").setHeading()
	//containerEl.createEl("h2", { text: "Anime note" });
	const descEl = containerEl.createEl("p", {
		cls: "setting-item-description",
	});
	descEl.appendChild(document.createTextNode("Anime template consists of frontmatter template and note body template.\
		For rendering template strings used "));
	descEl.createEl("a", {
		text: "Handlebars",
		href: "https://handlebarsjs.com/guide/"
	});
	descEl.appendChild(document.createTextNode(" engine so you can use Handlebars syntax.\
		In the moment plugin does not support list values so in order to make templates with arrays use {{#each}} syntax and separate values with \":::\" sequence."));

	new Setting(containerEl)
		.setName("Anime directory")
		.setDesc("Directory for anime notes")
		.addText((el) => {
			el
				.setValue(this.plugin.settings.animeNoteT.fileDir)
				.setPlaceholder("AL/Anime")
				.onChange(async (value) => {
					this.plugin.settings.animeNoteT.fileDir = value;
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
				btn.setIcon("delete").onClick(async () => {
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
				.setPlaceholder("{{notes}}")
				.setValue(this.plugin.settings.animeNoteT.noteBodyT)
				.onChange(async (value) => {
					this.plugin.settings.animeNoteT.noteBodyT = value;
					await this.plugin.saveSettings();
				});
			ta.inputEl.rows = 6;
			ta.inputEl.setCssProps({width: "100%"})
		});
}
