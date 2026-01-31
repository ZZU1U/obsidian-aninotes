import { requestUrl } from "obsidian";
import { AnimeSchema, UserAnimeList, UserAnimeListItem } from "models/anime";
import { MAL_ANIME_DETAIL_FIELDS, MAL_ANIMELIST_FIELDS } from "./constant";


export async function getUserAnimeList(token: string): Promise<UserAnimeList | undefined> {
    const baseUrl = "https://api.myanimelist.net/v2/users/@me/animelist";
    const query = new URLSearchParams({
        fields: MAL_ANIMELIST_FIELDS,
        limit: "100",
    }).toString();
    const initialUrl = `${baseUrl}?${query}`;

    const userList: UserAnimeList = {
        data: [],
        paging: {
            next: initialUrl,
            previous: "",
        },
    };

    while (userList.paging.next) {
        const tokenRes = await requestUrl({
            url: userList.paging.next,
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            throw: false,
        });

        if (tokenRes.status < 200 || tokenRes.status >= 300) {
            console.error("Get AnimeList error", tokenRes.status, tokenRes.text);
            return undefined;
        }

        try {
            const res = await tokenRes.json;
            userList.data = userList.data.concat(res.data);
            userList.paging.next = res.paging?.next;
        } catch {
            console.error("AnimeList was not a valid JSON:", tokenRes.text?.slice(0, 200));
            return undefined;
        } 
    }

    return userList;
}

/**
 * Get full anime details by ID. Use this when you need related_anime, related_manga, or other
 * fields that the user animelist endpoint does not return. The animelist only returns a subset
 * of anime node fields; related_anime and related_manga are only available from this endpoint.
 */
export async function getAnimeDetails(
    animeId: number,
    token: string,
    fields: string = MAL_ANIME_DETAIL_FIELDS
): Promise<AnimeSchema | undefined> {
    const url = `https://api.myanimelist.net/v2/anime/${animeId}?${new URLSearchParams({ fields }).toString()}`;
    const res = await requestUrl({
        url,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        throw: false,
    });
    if (res.status < 200 || res.status >= 300) return undefined;
    try {
        return (await res.json) as AnimeSchema;
    } catch {
        return undefined;
    }
}

/** Delay helper for rate limiting. */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enrich each list item with full anime details (including related_anime, related_manga).
 * Calls GET /anime/{id} once per entry; use a delayMs (e.g. 200–500) to avoid rate limits.
 */
export async function enrichUserAnimeListWithDetails(
    list: UserAnimeListItem[],
    token: string,
    options: { delayMs?: number; fields?: string } = {}
): Promise<UserAnimeListItem[]> {
    const { delayMs = 250, fields = MAL_ANIME_DETAIL_FIELDS } = options;
    const out: UserAnimeListItem[] = [];
    for (const item of list) {
        const details = await getAnimeDetails(item.node.id, token, fields);
        if (details) {
            out.push({
                node: { ...item.node, ...details },
                list_status: item.list_status,
            });
        } else {
            out.push(item);
        }
        if (delayMs > 0) await delay(delayMs);
    }
    return out;
}