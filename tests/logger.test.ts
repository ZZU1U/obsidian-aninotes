import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PluginLogger } from "../src/tools/logger";
import type { LogStore } from "../src/tools/logger";

function memoryStore(): { store: LogStore; read: () => string | null } {
	let contents: string | null = null;
	return {
		store: {
			load: async () => contents,
			write: async (value: string) => {
				contents = value;
			},
			clear: async () => {
				contents = null;
			},
		},
		read: () => contents,
	};
}

describe("PluginLogger", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("records entries in order with timestamps", () => {
		const logger = new PluginLogger();
		logger.info("first");
		logger.warn("second");

		const entries = logger.getEntries();
		expect(entries.map((entry) => entry.message)).toEqual(["first", "second"]);
		expect(entries.map((entry) => entry.level)).toEqual(["info", "warn"]);
		expect(Number.isNaN(new Date(entries[0]!.time).getTime())).toBe(false);
	});

	it("captures error details from Error objects", () => {
		const logger = new PluginLogger();
		logger.error("something broke", new Error("boom"));

		const entry = logger.getEntries()[0]!;
		expect(entry.detail).toContain("boom");
	});

	it("keeps at most 200 entries", () => {
		const logger = new PluginLogger();
		for (let i = 0; i < 205; i++) {
			logger.info(`entry ${i}`);
		}

		const entries = logger.getEntries();
		expect(entries).toHaveLength(200);
		expect(entries[0]!.message).toBe("entry 5");
		expect(entries[199]!.message).toBe("entry 204");
	});

	it("persists entries through the store after the debounce window", async () => {
		vi.useFakeTimers();
		try {
			const { store, read } = memoryStore();
			const logger = new PluginLogger();
			await logger.init(store);

			logger.info("hello");
			expect(read()).toBeNull();

			vi.advanceTimersByTime(1000);
			await vi.waitFor(() => expect(read()).not.toBeNull());

			const persisted = JSON.parse(read()!) as Array<{ message: string }>;
			expect(persisted.map((entry) => entry.message)).toEqual(["hello"]);
		} finally {
			vi.useRealTimers();
		}
	});

	it("flush writes pending entries immediately", async () => {
		const { store, read } = memoryStore();
		const logger = new PluginLogger();
		await logger.init(store);

		logger.warn("pending");
		await logger.flush();

		expect(read()).toContain("pending");
	});

	it("restores entries from the store on init", async () => {
		const { store } = memoryStore();
		const original = new PluginLogger();
		await original.init(store);
		original.info("survives restart");
		await original.flush();

		const restored = new PluginLogger();
		await restored.init(store);
		expect(restored.getEntries().map((entry) => entry.message)).toEqual(["survives restart"]);
	});

	it("ignores corrupt stored data", async () => {
		const { store, read } = memoryStore();
		await store.write("{not json");
		const logger = new PluginLogger();
		await logger.init(store);

		expect(logger.getEntries()).toEqual([]);
		expect(read()).toBe("{not json");
	});

	it("filters entries with unknown levels on load", async () => {
		const { store } = memoryStore();
		await store.write(JSON.stringify([
			{ time: "2024-01-01T00:00:00.000Z", level: "info", message: "ok" },
			{ time: "2024-01-01T00:00:01.000Z", level: "loud", message: "bad" },
			{ time: "not-an-entry" },
		]));

		const logger = new PluginLogger();
		await logger.init(store);

		expect(logger.getEntries().map((entry) => entry.message)).toEqual(["ok"]);
	});

	it("clear removes entries and the stored file", async () => {
		const { store, read } = memoryStore();
		const logger = new PluginLogger();
		await logger.init(store);
		logger.error("gone soon");
		await logger.flush();

		await logger.clear();

		expect(logger.getEntries()).toEqual([]);
		expect(read()).toBeNull();
	});
});
