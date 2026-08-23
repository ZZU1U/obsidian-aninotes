/**
 * In-plugin log so errors can be inspected even when the console is
 * disabled. Entries are kept in memory, mirrored to the console, and
 * persisted (debounced) through an injectable store, which keeps this
 * module free of `obsidian` imports and unit-testable.
 */

export type LogLevel = "error" | "warn" | "info";

export interface LogEntry {
	time: string;
	level: LogLevel;
	message: string;
	detail?: string;
}

export interface LogStore {
	load(): Promise<string | null>;
	write(contents: string): Promise<void>;
	clear(): Promise<void>;
}

const MAX_ENTRIES = 200;
const SAVE_DEBOUNCE_MS = 1_000;
const LEVELS: readonly string[] = ["error", "warn", "info"];

function isLogEntry(value: unknown): value is LogEntry {
	if (typeof value !== "object" || value === null) return false;

	const entry = value as Record<string, unknown>;
	return (
		typeof entry.time === "string" &&
		typeof entry.message === "string" &&
		typeof entry.level === "string" &&
		LEVELS.includes(entry.level) &&
		(entry.detail === undefined || typeof entry.detail === "string")
	);
}

function describeDetail(detail: unknown): string | undefined {
	if (detail === undefined) return undefined;
	if (typeof detail === "string") return detail === "" ? undefined : detail;
	if (detail instanceof Error) {
		return detail.stack ? `${detail.message}\n${detail.stack}` : detail.message;
	}
	try {
		// JSON.stringify returns undefined (not a throw) for functions/symbols.
		return JSON.stringify(detail, null, 2) ?? Object.prototype.toString.call(detail);
	} catch {
		return Object.prototype.toString.call(detail);
	}
}

export class PluginLogger {
	private entries: LogEntry[] = [];
	private store: LogStore | undefined;
	private saveTimer: ReturnType<typeof setTimeout> | undefined;

	/** Attaches persistent storage and loads previous entries. Unreadable storage starts fresh. */
	async init(store: LogStore): Promise<void> {
		this.store = store;
		try {
			const raw = await store.load();
			if (raw) {
				const parsed: unknown = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					this.entries = parsed.filter(isLogEntry).slice(-MAX_ENTRIES);
				}
			}
		} catch {
			this.entries = [];
		}
	}

	error(message: string, detail?: unknown): void {
		this.add("error", message, detail);
	}

	warn(message: string, detail?: unknown): void {
		this.add("warn", message, detail);
	}

	info(message: string): void {
		this.add("info", message);
	}

	/** Entries oldest-first. */
	getEntries(): LogEntry[] {
		return [...this.entries];
	}

	async clear(): Promise<void> {
		this.entries = [];
		if (this.saveTimer !== undefined) {
			clearTimeout(this.saveTimer);
			this.saveTimer = undefined;
		}
		try {
			await this.store?.clear();
		} catch {
			// nothing to remove
		}
	}

	/** Writes pending entries immediately; call when the plugin unloads. */
	async flush(): Promise<void> {
		if (this.saveTimer === undefined) return;
		clearTimeout(this.saveTimer);
		this.saveTimer = undefined;
		await this.persist();
	}

	private add(level: LogLevel, message: string, detail?: unknown): void {
		this.entries.push({
			time: new Date().toISOString(),
			level,
			message,
			detail: describeDetail(detail),
		});
		if (this.entries.length > MAX_ENTRIES) {
			this.entries.splice(0, this.entries.length - MAX_ENTRIES);
		}

		const args = detail === undefined ? [] : [detail];
		if (level === "error") console.error(`[AniNotes] ${message}`, ...args);
		else if (level === "warn") console.warn(`[AniNotes] ${message}`, ...args);
		else console.debug(`[AniNotes] ${message}`);

		this.scheduleSave();
	}

	private scheduleSave(): void {
		if (!this.store) return;
		if (this.saveTimer !== undefined) clearTimeout(this.saveTimer);
		this.saveTimer = setTimeout(() => {
			this.saveTimer = undefined;
			void this.persist();
		}, SAVE_DEBOUNCE_MS);
	}

	private async persist(): Promise<void> {
		if (!this.store) return;
		try {
			await this.store.write(JSON.stringify(this.entries, null, 2));
		} catch (error) {
			console.error("[AniNotes] Failed to persist plugin log:", error);
		}
	}
}

export const logger = new PluginLogger();
