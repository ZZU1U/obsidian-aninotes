import { requestUrl } from "obsidian";
import type { RequestUrlResponse } from "obsidian";
import { ANILIST_GRAPHQL_URL, ANILIST_OAUTH_BASE_URL, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from "./constant";
import { anilistErrorMessage } from "./anilist";
import type { OAuthTokenSchema, UserInfo } from "../models/auth";
import { gqlData } from "../tools/graphql";

export function createALOAuthURL(): string {
	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		redirect_uri: REDIRECT_URI,
		response_type: "code",
	});
	return `${ANILIST_OAUTH_BASE_URL}/authorize?${params.toString()}`;
}

export async function exchangeALCode(code: string): Promise<OAuthTokenSchema> {
	let response: RequestUrlResponse;
	try {
		response = await requestUrl({
			url: `${ANILIST_OAUTH_BASE_URL}/token`,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
			},
			body: JSON.stringify({
				"grant_type": "authorization_code",
				"client_id": CLIENT_ID,
				"client_secret": CLIENT_SECRET,
				"redirect_uri": REDIRECT_URI,
				"code": code,
			}),
		});
	} catch (error) {
		const reason = error instanceof Error ? error.message : "network error";
		throw new Error(`AniList authentication failed: ${reason}`);
	}

	if (response.status !== 200) {
		const reason = anilistErrorMessage(response.json) ?? `HTTP ${response.status}`;
		throw new Error(`AniList authentication failed: ${reason}`);
	}

	const json = response.json as Partial<OAuthTokenSchema> | null;
	if (typeof json?.access_token !== "string" || !json.access_token || typeof json.refresh_token !== "string") {
		throw new Error("AniList authentication returned an unexpected response");
	}

	return {
		access_token: json.access_token,
		refresh_token: json.refresh_token,
		expires_in: typeof json.expires_in === "number" ? json.expires_in : 0,
		token_type: typeof json.token_type === "string" ? json.token_type : "bearer",
	};
}

export async function getUserInfo(accessToken: string): Promise<UserInfo> {
	const query = `
    query {
        Viewer {
            id
            name
        }
    }
    `;

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
			body: JSON.stringify({ query, variables: {} }),
		});
	} catch (error) {
		const reason = error instanceof Error ? error.message : "network error";
		throw new Error(`AniList request failed: ${reason}`);
	}

	if (response.status !== 200) {
		const reason = anilistErrorMessage(response.json) ?? `HTTP ${response.status}`;
		throw new Error(`AniList request failed: ${reason}`);
	}

	const data = gqlData<{ Viewer?: { id?: number | null; name?: string | null } }>(response);
	const viewer = data.Viewer;
	if (typeof viewer?.id !== "number" || typeof viewer.name !== "string") {
		throw new Error("AniList returned an unexpected viewer response");
	}

	return { id: viewer.id, name: viewer.name };
}
