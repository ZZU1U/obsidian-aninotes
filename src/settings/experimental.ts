import { Setting } from "obsidian";
import type { SettingTab } from "../settings";
import type { FetchOptions } from "api/common";

export function renderExperimental(this: SettingTab, containerEl: HTMLElement) {
	new Setting(containerEl)
		.setName("Experimental")
		.setHeading();

	containerEl.createEl("p", {
		text: "These settings include behaviour which is currentl under development. \
			It is highly recommended to leave these settings as is because their behaviour is unpredictable.",
		cls: "setting-item-description",
	});

	for (const key in this.plugin.settings.apiFetchOptions) {
		const option = this.plugin.settings.apiFetchOptions[key as keyof FetchOptions];
		new Setting(containerEl)
			.setName(`Fetch ${key}`)
			.setDesc(`When syncing, fetch ${key} for each entry (one API request per entry; slower).`)
			.addToggle((el) => {
				el.setValue(option);
				el.onChange(async (value) => {
					this.plugin.settings.apiFetchOptions[key as keyof FetchOptions] = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
