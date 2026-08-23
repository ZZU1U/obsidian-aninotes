import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, autoSyncIntervalMinutes, mergeSettings } from "../src/constant";
import type { AniNotesSettings } from "../src/settings";

function settingsWith(overrides: Partial<AniNotesSettings>): AniNotesSettings {
	return { ...DEFAULT_SETTINGS, ...overrides };
}

describe("autoSyncIntervalMinutes", () => {
	it("returns 0 when disabled", () => {
		expect(autoSyncIntervalMinutes(settingsWith({ autoSyncInterval: "off" }))).toBe(0);
	});

	it("resolves the presets in minutes", () => {
		expect(autoSyncIntervalMinutes(settingsWith({ autoSyncInterval: "hour" }))).toBe(60);
		expect(autoSyncIntervalMinutes(settingsWith({ autoSyncInterval: "day" }))).toBe(24 * 60);
		expect(autoSyncIntervalMinutes(settingsWith({ autoSyncInterval: "week" }))).toBe(7 * 24 * 60);
	});

	it("uses the custom value in minutes", () => {
		expect(autoSyncIntervalMinutes(settingsWith({ autoSyncInterval: "custom", autoSyncCustomInterval: 90 }))).toBe(90);
	});

	it("rounds and clamps custom values to a sane range", () => {
		expect(autoSyncIntervalMinutes(settingsWith({ autoSyncInterval: "custom", autoSyncCustomInterval: -5 }))).toBe(1);
		expect(autoSyncIntervalMinutes(settingsWith({ autoSyncInterval: "custom", autoSyncCustomInterval: 90.6 }))).toBe(91);
		expect(autoSyncIntervalMinutes(settingsWith({ autoSyncInterval: "custom", autoSyncCustomInterval: 10_000_000 }))).toBe(30 * 24 * 60);
	});

	it("treats non-numeric custom values as disabled", () => {
		expect(autoSyncIntervalMinutes(settingsWith({ autoSyncInterval: "custom", autoSyncCustomInterval: Number.NaN }))).toBe(0);
	});
});

describe("auto sync settings merging", () => {
	it("defaults auto sync to off with notifications on", () => {
		const merged = mergeSettings(DEFAULT_SETTINGS, null);
		expect(merged.autoSyncOnStartup).toBe(false);
		expect(merged.autoSyncInterval).toBe("off");
		expect(merged.autoSyncCustomInterval).toBe(60);
		expect(merged.notifyOnSync).toBe(true);
	});

	it("falls back to off for unknown interval modes", () => {
		const merged = mergeSettings(DEFAULT_SETTINGS, { autoSyncInterval: "banana" as never });
		expect(merged.autoSyncInterval).toBe("off");
	});

	it("keeps stored auto sync settings", () => {
		const merged = mergeSettings(DEFAULT_SETTINGS, {
			autoSyncOnStartup: true,
			autoSyncInterval: "custom",
			autoSyncCustomInterval: 25,
			notifyOnSync: false,
		});
		expect(merged.autoSyncOnStartup).toBe(true);
		expect(merged.autoSyncInterval).toBe("custom");
		expect(merged.autoSyncCustomInterval).toBe(25);
		expect(merged.notifyOnSync).toBe(false);
	});
});
