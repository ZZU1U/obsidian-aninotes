import { Setting } from "obsidian";
import { createALOAuthURL } from "api/auth";
import { openInBrowser } from "tools/browser";
import type { SettingTab } from "../settings";

export function renderGeneral(this: SettingTab, containerEl: HTMLElement) {
	this.accountAL = new Setting(containerEl)
		// eslint-disable-next-line obsidianmd/ui/sentence-case
		.setName("AniList account")
		.addButton(async btn => {
			btn
				.setButtonText(this.plugin.settings.tokenAL === undefined ? "Connect" : "Reconnect")
				.setCta()
				.onClick(() => {
					const authUrl = createALOAuthURL();
					openInBrowser(authUrl.url);
				});
			if (this.plugin.settings.fetchUserDataAtStartup) {
				await this.plugin.updateALProfile();
			} else {
				const userInfo = this.plugin.settings.accountALInfo
				if (userInfo && this.accountAL) {
					this.accountAL.setDesc(`User: ${userInfo.name}; id: ${userInfo.id}`)
				}
			}
		})
		.addButton(btn => {
			btn
				.setIcon("sync")
				.setTooltip("Update on demand")
				.onClick(async cb => {
					await this.plugin.updateALProfile()
				})
		});

	if (this.plugin.settings.accountALInfo) {
		const userInfo = this.plugin.settings.accountALInfo;
		this.accountAL.setDesc(`User: ${userInfo.name}; id: ${userInfo.id}`)
	}

	// new Setting(containerEl)
	// 	.setName("Fetch API user info")
	// 	.setDesc("Allow plugin to fetch user name and ID on Obsidian startup.\
	// 		If turned off, will display data that was fetched last time.")
	// 	.addToggle(tgl => {
	// 		tgl
	// 			.setValue(this.plugin.settings.fetchUserDataAtStartup)
	// 			.onChange(async (val: boolean) => {
	// 				this.plugin.settings.fetchUserDataAtStartup = val;
	// 				await this.plugin.saveSettings()
	// 			})
	// 	})
}
