import { Setting } from "obsidian";
import type { SettingTab } from "../settings";
import type { FetchOptions } from "api/common";

export function renderExperimental(this: SettingTab, containerEl: HTMLElement) {
	new Setting(containerEl)
		.setName("Experimental")
		.setHeading();

	containerEl.createEl("p", {
		text: "These settings are such that you only want to turn on if you know what you are doing as the tab name may suggest.",
		cls: "setting-item-description",
	});

	for (const key in this.plugin.settings.apiFetchOptions) {
		const option = this.plugin.settings.apiFetchOptions[key as keyof FetchOptions];
		new Setting(containerEl)
			.setName(`Fetch ${key}`)
			.setDesc(`When syncing, fetch ${key} for each entry (may cause severe slow down and data consumption).`)
			.addToggle((el) => {
				el.setValue(option);
				el.onChange(async (value) => {
					this.plugin.settings.apiFetchOptions[key as keyof FetchOptions] = value;
					await this.plugin.saveSettings();
				});
			});
	}

	new Setting(containerEl)
		.setName("Use custom anime request")
		.setDesc("When syncing, use a custom anime request instead of the one constructed by plugin.")
		.addToggle((el) => {
			el.setValue(this.plugin.settings.useCustomAnimeRequest);
			el.onChange(async (value) => {
				this.plugin.settings.useCustomAnimeRequest = value;
				await this.plugin.saveSettings();
			});
		}).addTextArea((el) => {
			el.setValue(this.plugin.settings.customAnimeRequest);
			el.onChange(async (value) => {
				this.plugin.settings.customAnimeRequest = value;
				await this.plugin.saveSettings();
			});
		});

	new Setting(containerEl)
		.setName("Use custom manga request")
		.setDesc("When syncing, use a custom manga request instead of the one constructed by plugin.")
		.addToggle((el) => {
			el.setValue(this.plugin.settings.useCustomMangaRequest);
			el.onChange(async (value) => {
				this.plugin.settings.useCustomMangaRequest = value;
				await this.plugin.saveSettings();
			});
		}).addTextArea((el) => {
			el.setValue(this.plugin.settings.customMangaRequest);
			el.onChange(async (value) => {
				this.plugin.settings.customMangaRequest = value;
				await this.plugin.saveSettings();
			});
		});
}
