import { Notice, ObsidianProtocolData, Plugin } from "obsidian";
import { SettingTab } from "./settings";
import type { AniNotesSettings } from "./settings";
import { DEFAULT_SETTINGS, autoSyncIntervalMinutes, mergeSettings } from "./constant";
import type { StoredSettings } from "./constant";
import { exchangeALCode, getUserInfo } from "./api/auth";
import { syncUserMediaList } from "./commands";
import { logger } from "./tools/logger";

export default class AniNotesPlugin extends Plugin {
	settings!: AniNotesSettings;
	settingsTab?: SettingTab = undefined;
	private syncIntervalId?: number;

	async onload(): Promise<void> {
		await this.loadSettings();
		await this.initLogger();

		this.addCommand({
			id: "sync-anime-list",
			name: "Sync user anime list",
			callback: () => void syncUserMediaList(this, "anime"),
		});

		this.addCommand({
			id: "sync-manga-list",
			name: "Sync user manga list",
			callback: () => void syncUserMediaList(this, "manga"),
		});

		this.addCommand({
			id: "sync-all-lists",
			name: "Sync all",
			// Each sync surfaces its own errors, so one failing list
			// does not block the other.
			callback: async () => {
				await syncUserMediaList(this, "anime");
				await syncUserMediaList(this, "manga");
			},
		});

		this.settingsTab = new SettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);

		this.registerObsidianProtocolHandler(
			"man-revive-sync/al",
			async (params: ObsidianProtocolData) => {
				await this.handleAuthCallback(params);
			},
		);

		this.app.workspace.onLayoutReady(() => {
			void (async () => {
				// Refresh the profile first so a startup sync has fresh account data.
				if (this.settings.fetchUserDataAtStartup && this.settings.tokenAL) {
					await this.updateALProfile();
				}
				if (this.settings.autoSyncOnStartup) {
					await this.autoSyncAllLists();
				}
			})();
		});

		this.rescheduleAutoSync();
	}

	/** Syncs both lists; skips silently when the account is not connected. */
	async autoSyncAllLists(): Promise<void> {
		if (!this.settings.tokenAL?.access_token || !this.settings.accountALInfo) return;

		await syncUserMediaList(this, "anime");
		await syncUserMediaList(this, "manga");
	}

	/** (Re)starts the background sync timer from the current settings. */
	rescheduleAutoSync(): void {
		if (this.syncIntervalId !== undefined) {
			window.clearInterval(this.syncIntervalId);
			this.syncIntervalId = undefined;
		}

		const minutes = autoSyncIntervalMinutes(this.settings);
		if (minutes <= 0) return;

		this.syncIntervalId = this.registerInterval(
			window.setInterval(() => void this.autoSyncAllLists(), minutes * 60_000),
		);
	}

	private async initLogger(): Promise<void> {
		if (!this.manifest.dir) return;

		const logPath = `${this.manifest.dir}/log.json`;
		await logger.init({
			load: async () => {
				try {
					return await this.app.vault.adapter.read(logPath);
				} catch {
					return null; // no log file yet
				}
			},
			write: (contents) => this.app.vault.adapter.write(logPath, contents),
			clear: async () => {
				try {
					await this.app.vault.adapter.remove(logPath);
				} catch {
					// already gone
				}
			},
		});
	}

	private async handleAuthCallback(params: ObsidianProtocolData): Promise<void> {
		const code = params?.code;
		if (!code) {
			new Notice("Bad auth: no code returned");
			return;
		}

		try {
			this.settings.tokenAL = await exchangeALCode(code);
			await this.saveSettings();
			new Notice("Connected to AniList");
			await this.updateALProfile();
		} catch (error) {
			logger.error("AniList authentication failed", error);
			new Notice(`AniList login failed: ${error instanceof Error ? error.message : "unknown error"}`);
		}
	}

	onunload(): void {
		void logger.flush();
	}

	async loadSettings(): Promise<void> {
		const stored = (await this.loadData()) as StoredSettings | null;
		this.settings = mergeSettings(DEFAULT_SETTINGS, stored);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async updateALProfile(): Promise<void> {
		this.settingsTab?.accountAL?.setDesc("Updating...");

		if (!this.settings.tokenAL?.access_token) {
			new Notice("Anilist account is not logged in");
			return;
		}

		try {
			const user = await getUserInfo(this.settings.tokenAL.access_token);

			this.settings.accountALInfo = { id: user.id, name: user.name };
			await this.saveSettings();

			this.settingsTab?.accountAL?.setDesc(`User: ${user.name}; id: ${user.id}`);
		} catch (error) {
			logger.error("Failed to update AniList profile", error);
			new Notice("User info update failed");
		}
	}
}
