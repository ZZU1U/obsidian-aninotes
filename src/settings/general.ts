import { Setting } from "obsidian";
import { createALOAuthURL } from "../api/auth";
import { openInBrowser } from "../tools/browser";
import type { SettingTab } from "../settings";
import type { AutoSyncIntervalMode } from "../constant";

export function renderGeneral(this: SettingTab, containerEl: HTMLElement): void {
	this.accountAL = new Setting(containerEl)
		.setName("Anilist account")
		.addButton((btn) => {
			btn
				.setButtonText(this.plugin.settings.tokenAL === undefined ? "Connect" : "Reconnect")
				.setCta()
				.onClick(() => openInBrowser(createALOAuthURL()));
		})
		.addButton((btn) => {
			btn
				.setIcon("sync")
				.setTooltip("Update on demand")
				.onClick(() => void this.plugin.updateALProfile());
		});

	const userInfo = this.plugin.settings.accountALInfo;
	if (userInfo) {
		this.accountAL.setDesc(`User: ${userInfo.name}; id: ${userInfo.id}`);
	}

	renderSyncSettings(this, containerEl);
}

function renderSyncSettings(tab: SettingTab, containerEl: HTMLElement): void {
	const plugin = tab.plugin;
	const settings = plugin.settings;

	new Setting(containerEl).setName("Sync").setHeading();

	new Setting(containerEl)
		.setName("Sync on startup")
		.setDesc("Sync all lists when Obsidian starts.")
		.addToggle((tgl) => {
			tgl
				.setValue(settings.autoSyncOnStartup)
				.onChange(async (value) => {
					settings.autoSyncOnStartup = value;
					await plugin.saveSettings();
				});
		});

	new Setting(containerEl)
		.setName("Auto sync interval")
		.setDesc("Sync all lists in the background on a schedule while Obsidian is running.")
		.addDropdown((drp) => {
			drp
				.addOption("off", "Off")
				.addOption("hour", "Every hour")
				.addOption("day", "Every day")
				.addOption("week", "Every week")
				.addOption("custom", "Custom")
				.setValue(settings.autoSyncInterval)
				.onChange(async (value) => {
					settings.autoSyncInterval = value as AutoSyncIntervalMode;
					await plugin.saveSettings();
					plugin.rescheduleAutoSync();
					tab.display();
				});
		});

	if (settings.autoSyncInterval === "custom") {
		new Setting(containerEl)
			.setName("Custom interval")
			.setDesc("Minutes between background syncs.")
			.addText((txt) => {
				txt.inputEl.type = "number";
				txt
					.setValue(String(settings.autoSyncCustomInterval))
					.onChange(async (value) => {
						const minutes = Number.parseInt(value, 10);
						if (!Number.isFinite(minutes)) return;
						settings.autoSyncCustomInterval = minutes;
						await plugin.saveSettings();
						plugin.rescheduleAutoSync();
					});
			});
	}

	new Setting(containerEl)
		.setName("Sync notifications")
		.setDesc("Show a notice when a sync finishes or finds nothing to update. Errors are always shown.")
		.addToggle((tgl) => {
			tgl
				.setValue(settings.notifyOnSync)
				.onChange(async (value) => {
					settings.notifyOnSync = value;
					await plugin.saveSettings();
				});
		});
}
