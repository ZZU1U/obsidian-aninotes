import { describe, expect, it } from "vitest";
import { generateMediaListQuery } from "../src/api/query";
import type { FetchOptions } from "../src/api/common";

const NO_HEAVY_FIELDS: FetchOptions = {
	includeRelations: false,
	includeCharacters: false,
	includeStudios: false,
	includeStaff: false,
	includeTags: false,
	includeExternalLinks: false,
};

describe("generateMediaListQuery", () => {
	it("requests episodes for anime", () => {
		const query = generateMediaListQuery(NO_HEAVY_FIELDS, "ANIME");
		expect(query).toContain("episodes");
		expect(query).not.toContain("chapters");
		expect(query).not.toContain("volumes");
	});

	it("requests chapters and volumes for manga", () => {
		const query = generateMediaListQuery(NO_HEAVY_FIELDS, "MANGA");
		expect(query).toContain("chapters");
		expect(query).toContain("volumes");
		expect(query).not.toContain("episodes");
	});

	it("always includes the base entry and media fields", () => {
		const query = generateMediaListQuery(NO_HEAVY_FIELDS, "ANIME");
		expect(query).toContain("MediaListCollection(type: $type, userId: $userId)");
		expect(query).toContain("startedAt { day month year }");
		expect(query).toContain("title { romaji english native userPreferred }");
	});

	it("omits heavy fields when no options are enabled", () => {
		const query = generateMediaListQuery(NO_HEAVY_FIELDS, "ANIME");
		expect(query).not.toContain("studios");
		expect(query).not.toContain("characters");
		expect(query).not.toContain("externalLinks");
	});

	it("includes enabled heavy fields", () => {
		const query = generateMediaListQuery(
			{ ...NO_HEAVY_FIELDS, includeStudios: true, includeTags: true },
			"MANGA",
		);
		expect(query).toContain("studios { nodes { id name } }");
		expect(query).toContain("tags { name }");
		expect(query).not.toContain("characters");
	});
});
