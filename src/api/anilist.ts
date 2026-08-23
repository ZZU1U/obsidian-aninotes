import { requestUrl } from "obsidian";
import type { RequestUrlResponse } from "obsidian";
import { ANILIST_GRAPHQL_URL } from "./constant";
import { gqlData } from "../tools/graphql";
import { generateMediaListQuery } from "./query";
import type { MediaListType } from "./query";
import type { FetchOptions } from "./common";
import type { MediaList, Query } from "../generated/anilist-schema";

/** Reads a human-readable message out of an AniList error payload, if any. */
export function anilistErrorMessage(json: unknown): string | undefined {
	if (typeof json !== "object" || json === null) return undefined;

	const payload = json as {
		error?: unknown;
		message?: unknown;
		errors?: Array<{ message?: unknown } | null>;
	};

	if (typeof payload.message === "string" && payload.message) return payload.message;
	if (typeof payload.error === "string" && payload.error) return payload.error;

	const first = payload.errors?.[0]?.message;
	return typeof first === "string" && first ? first : undefined;
}

function errorReason(error: unknown): string {
	return error instanceof Error ? error.message : "network error";
}

async function anilistGraphQLRequest<T>(
	accessToken: string,
	query: string,
	variables: Record<string, unknown>,
): Promise<T> {
	let response: RequestUrlResponse;
	try {
		response = await requestUrl({
			url: ANILIST_GRAPHQL_URL,
			method: "POST",
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Content-Type": "application/json",
				"Accept": "application/json",
			},
			body: JSON.stringify({ query, variables }),
		});
	} catch (error) {
		throw new Error(`AniList request failed: ${errorReason(error)}`);
	}

	if (response.status !== 200) {
		const reason = anilistErrorMessage(response.json) ?? `HTTP ${response.status}`;
		throw new Error(`AniList request failed: ${reason}`);
	}

	return gqlData<T>(response);
}

export interface UserMediaListParams {
	accessToken: string;
	userId: number;
	mediaType: MediaListType;
	options: FetchOptions;
	/** Raw user-supplied GraphQL query; when empty the built-in query is generated from `options`. */
	customRequest?: string;
}

/**
 * Fetches the user's anime or manga list as a flat list of entries.
 * Throws on network, HTTP and GraphQL errors.
 */
export async function getUserMediaList(params: UserMediaListParams): Promise<MediaList[]> {
	const query = params.customRequest?.trim()
		? params.customRequest
		: generateMediaListQuery(params.options, params.mediaType);

	const data = await anilistGraphQLRequest<Query>(params.accessToken, query, {
		type: params.mediaType,
		userId: params.userId,
	});

	const collection = data.MediaListCollection;
	if (!collection?.lists) return [];

	const entries: MediaList[] = [];
	for (const list of collection.lists) {
		for (const entry of list?.entries ?? []) {
			if (entry) entries.push(entry);
		}
	}
	return entries;
}
