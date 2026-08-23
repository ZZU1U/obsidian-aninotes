import { Notice, Setting } from "obsidian";
import type { SettingTab } from "../settings";
import { logger } from "../tools/logger";
import type { LogEntry } from "../tools/logger";

function formatLogTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;

	const pad = (value: number) => String(value).padStart(2, "0");
	return (
		`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
		`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
	);
}

function formatEntriesAsText(entries: LogEntry[]): string {
	return entries
		.map((entry) => {
			const base = `[${entry.time}] ${entry.level.toUpperCase()}: ${entry.message}`;
			return entry.detail ? `${base}\n${entry.detail}` : base;
		})
		.join("\n\n");
}

export function renderLog(this: SettingTab, containerEl: HTMLElement): void {
	new Setting(containerEl).setName("Plugin log").setHeading();

	containerEl.createEl("p", {
		text: "Errors, warnings and sync results recorded by the plugin, newest first. The latest 200 entries are kept across restarts.",
		cls: "setting-item-description",
	});

	new Setting(containerEl)
		.addButton((btn) => {
			btn
				.setButtonText("Copy")
				.setTooltip("Copy log entries to the clipboard")
				.onClick(async () => {
					try {
						await navigator.clipboard.writeText(formatEntriesAsText(logger.getEntries().reverse()));
						new Notice("Log copied to clipboard");
					} catch (error) {
						new Notice("Could not copy the log");
						logger.warn("Failed to copy log to clipboard", error);
					}
				});
		})
		.addButton((btn) => {
			btn
				.setButtonText("Clear")
				.onClick(async () => {
					await logger.clear();
					this.display();
				});
		});

	const entries = logger.getEntries().reverse();
	if (entries.length === 0) {
		const emptyState = containerEl.createDiv({ cls: "man-empty-state" });
		emptyState.createEl("p", {
			text: "Nothing recorded yet. Errors and warnings will show up here.",
			cls: "setting-item-description",
		});
		return;
	}

	const listEl = containerEl.createDiv({ cls: "man-log-list" });
	for (const entry of entries) {
		const rowEl = listEl.createDiv({ cls: `man-log-entry man-log-${entry.level}` });

		const headEl = rowEl.createDiv({ cls: "man-log-entry-head" });
		headEl.createSpan({ text: formatLogTime(entry.time), cls: "man-log-time" });
		headEl.createSpan({ text: entry.level, cls: "man-log-level" });
		headEl.createSpan({ text: entry.message, cls: "man-log-message" });

		if (entry.detail) {
			const detailsEl = rowEl.createEl("details", { cls: "man-log-detail" });
			detailsEl.createEl("summary", { text: "Details" });
			detailsEl.createEl("pre", { text: entry.detail });
		}
	}
}
