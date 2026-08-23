import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, mergeSettings } from "../src/constant";

describe("mergeSettings", () => {
	it("returns defaults when nothing is stored", () => {
		expect(mergeSettings(DEFAULT_SETTINGS, null)).toEqual(DEFAULT_SETTINGS);
	});

	it("does not share state with the defaults", () => {
		const merged = mergeSettings(DEFAULT_SETTINGS, null);
		merged.animeNoteT.frontMatterT[0]!.key = "mutated";
		merged.apiFetchOptions.includeTags = true;

		expect(DEFAULT_SETTINGS.animeNoteT.frontMatterT[0]!.key).toBe("title");
		expect(DEFAULT_SETTINGS.apiFetchOptions.includeTags).toBe(false);
	});

	it("merges nested fetch options per-key", () => {
		const merged = mergeSettings(DEFAULT_SETTINGS, {
			apiFetchOptions: { includeTags: true },
		});
		expect(merged.apiFetchOptions.includeTags).toBe(true);
		expect(merged.apiFetchOptions.includeStudios).toBe(false);
	});

	it("replaces frontmatter entries wholesale so deletions stick", () => {
		const merged = mergeSettings(DEFAULT_SETTINGS, {
			animeNoteT: {
				fileDir: "Custom/Dir",
				fileNameT: "x.md",
				frontMatterT: [{ key: "only", value: "media.id", type: "number" }],
				noteBodyT: "body",
			},
		});
		expect(merged.animeNoteT.frontMatterT).toHaveLength(1);
		expect(merged.animeNoteT.frontMatterT[0]!.key).toBe("only");
		expect(merged.animeNoteT.fileDir).toBe("Custom/Dir");
		expect(merged.mangaNoteT).toEqual(DEFAULT_SETTINGS.mangaNoteT);
	});

	it("keeps stored scalar settings", () => {
		const merged = mergeSettings(DEFAULT_SETTINGS, { allowUserNoteNames: true });
		expect(merged.allowUserNoteNames).toBe(true);
		expect(merged.fetchUserDataAtStartup).toBe(true);
	});
});
