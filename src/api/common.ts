/**
 * Options for controlling which heavy fields to include in the query
 */
export interface FetchOptions {
    includeRelations: boolean;
    includeCharacters: boolean;
    includeStudios: boolean;
    includeStaff: boolean;
    includeTags: boolean;
    includeExternalLinks: boolean;
}