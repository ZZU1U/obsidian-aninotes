import type { FetchOptions } from "./common";

export type MediaListType = "ANIME" | "MANGA";

const ENTRY_FIELDS = [
	"id",
	"status",
	"startedAt { day month year }",
	"completedAt { day month year }",
	"progress",
	"score",
	"notes",
].join("\n");

function heavyFields(options: FetchOptions): string[] {
	const fields: string[] = [];

	if (options.includeRelations) {
		fields.push("relations { edges { relationType node { id title { userPreferred } format } } }");
	}

	if (options.includeCharacters) {
		fields.push("characters { nodes { id name { userPreferred full native } } }");
	}

	if (options.includeStudios) {
		fields.push("studios { nodes { id name } }");
	}

	if (options.includeStaff) {
		fields.push("staff { nodes { id name { userPreferred full native } } }");
	}

	if (options.includeTags) {
		fields.push("tags { name }");
	}

	if (options.includeExternalLinks) {
		fields.push("externalLinks { url site }");
	}

	return fields;
}

/**
 * Generates a MediaListCollection query with optional heavy fields.
 * Pure string builder — keep this module free of `obsidian` imports so it
 * stays unit-testable.
 */
export function generateMediaListQuery(options: FetchOptions, mediaType: MediaListType): string {
	const lengthFields = mediaType === "ANIME" ? ["episodes"] : ["chapters", "volumes"];

	const mediaFields = [
		// Basic fields (always included)
		"id",
		"idMal",
		"title { romaji english native userPreferred }",
		"startDate { day month year }",
		"endDate { day month year }",
		"format",
		"status",
		"description",
		...lengthFields,
		"countryOfOrigin",
		"coverImage { extraLarge large }",
		"genres",
		"synonyms",
		"averageScore",
		"isFavourite",
		"siteUrl",
		// Heavy fields (conditionally included)
		...heavyFields(options),
	].join("\n");

	return `
    query ($type: MediaType!, $userId: Int!) {
        MediaListCollection(type: $type, userId: $userId) {
            lists {
                name
                entries {
                    ${ENTRY_FIELDS}
                    media {
                        ${mediaFields}
                    }
                }
            }
        }
    }
    `;
}
