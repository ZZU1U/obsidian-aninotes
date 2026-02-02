import { Setting } from "obsidian";
import type { SettingTab } from "../settings";

export function renderExperimental(this: SettingTab, containerEl: HTMLElement) {
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
