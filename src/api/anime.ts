import type {Media, MediaListCollection, MediaListGroup, MediaList, Query} from "generated/anilist-schema"
import { requestUrl } from "obsidian";
import { gqlData } from "tools/graphql";
import { FetchOptions } from "./common";


/**
 * Generates a GraphQL query with optional heavy fields
 */
function generateQuery(options: FetchOptions): string {
    const heavyFields = [];
    
    if (options.includeRelations) {
        heavyFields.push('relations { edges { relationType node { id title { userPreferred } } } }');
    }
    
    if (options.includeCharacters) {
        heavyFields.push('characters { nodes { id name { userPreferred full native } } }');
    }
    
    if (options.includeStudios) {
        heavyFields.push('studios { nodes { id name } }');
    }
    
    if (options.includeStaff) {
        heavyFields.push('staff { nodes { id name { userPreferred full native } } }');
    }
    
    if (options.includeTags) {
        heavyFields.push('tags { name }');
    }
    
    if (options.includeExternalLinks) {
        heavyFields.push('externalLinks { url site }');
    }

    const entryFields = [
        'id',
        'status',
        'startedAt { day month year }',
        'completedAt { day month year }',
        'progress',
        'score',
        'notes'
    ].join('\n');
    
    const mediaFields = [
        // Basic fields (always included)
        'id',
        'idMal',
        'title { romaji english native userPreferred }',
        'startDate { day month year }',
        'endDate { day month year }',
        'format',
        'status',
        'description',
        'episodes',
        'countryOfOrigin',
        'coverImage { extraLarge large }',
        'genres',
        'synonyms',
        'averageScore',
        'isFavourite',
        'siteUrl',
        // Heavy fields (conditionally included)
        ...heavyFields
    ].join('\n');
    
    return `
    query ($type: MediaType!, $userId: Int!) {
        MediaListCollection(type: $type, userId: $userId) {
            lists {
                name
                entries {
                    ${entryFields}
                    media {
                        ${mediaFields}
                    }
                }
            }
        }
    }
    `;
}

/**
 * Gets user's anime list with optional heavy fields and strong typing
 * @param accessToken - Anilist API access token
 * @param userId - Anilist user ID
 * @param options - Options to include heavy fields like relations, characters, etc.
 * @returns Promise with strongly typed anime list data
 * 
 * @example
 * // Get basic anime list (fast, lightweight)
 * const result = await getUserAnimeList(token, userId);
 * console.log(result[0].media.title.romaji); // Fully typed!
 * 
 * @example
 * // Get anime list with studios and relations
 * const result = await getUserAnimeList(token, userId, { 
 *   includeStudios: true, 
 *   includeRelations: true 
 * });
 * 
 * @example
 * // Get everything (slow, heavy)
 * const result = await getUserAnimeList(token, userId, {
 *   includeRelations: true,
 *   includeCharacters: true,
 *   includeStudios: true,
 *   includeStaff: true,
 *   includeTags: true,
 *   includeExternalLinks: true
 * });
 */
export const getUserAnimeList = async (
    accessToken: string, 
    userId: number, 
    options: FetchOptions,
    useCustomRequest: boolean,
    customRequest: string
): Promise<MediaList[] | undefined> => {
    // Generate query with specified options
    const query = useCustomRequest ? customRequest : generateQuery(options);

    const variables = {
        type: "ANIME",
        userId
    };

    const url = 'https://graphql.anilist.co',
        method = 'POST',
        headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body = JSON.stringify({
            query: query,
            variables: variables
        });

    try {
        const response = await requestUrl({
            url,
            method,
            headers,
            body,
        });

        if (!response.json || response.status !== 200) {
            throw new Error(`GraphQL Error: Unknown error'}`);
        }

        const data = gqlData<Query>(response).MediaListCollection;

        if (!data?.lists) return undefined;

        console.debug('Successfully fetched anime list');
        
        const userAnimeList: MediaList[] = [];

        for (const list of data.lists) {
            if (list && list.entries) userAnimeList.push(...list.entries.filter(Boolean) as MediaList[]);
        }

        return userAnimeList;
    } catch (error) {
        console.error('Failed to fetch anime list:', error);
        throw new Error(`Anilist API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}