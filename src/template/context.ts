/*
 * Build template context from anime list item for Clipper-style templates.
 */

import { UserAnimeListItem } from "../models/anime";

/**
 * Flatten anime list item into a plain object for {{variable}} and {{variable|filter}}.
 * Supports: title, media_type, genres, studios, status, score, etc.
 */
export function animeTemplateContext(item: UserAnimeListItem): Record<string, unknown> {
	const { node, list_status } = item;
	return {
		// Identity
		id: node.id,
		title: node.title,
		alternative_titles: node.alternative_titles,
		en_title: node.alternative_titles?.en ?? node.title,
		ja_title: node.alternative_titles?.ja,

		// Type and status
		media_type: node.media_type,
		status: node.status,
		source: node.source,
		rating: node.rating,

		// Counts and dates
		num_episodes: node.num_episodes,
		start_date: node.start_date,
		end_date: node.end_date,
		start_season: node.start_season,
		broadcast: node.broadcast,

		// Content
		synopsis: node.synopsis,
		genres: node.genres ?? [],
		studios: node.studios ?? [],
		main_picture: node.main_picture,
		// Only present when list is enriched via getAnimeDetails (not returned by animelist endpoint)
		related_anime: node.related_anime ?? [],
		related_manga: node.related_manga ?? [],

		// Stats
		mean: node.mean,
		rank: node.rank,
		popularity: node.popularity,

		// User list status
		watch_status: list_status.status,
		score: list_status.score,
		num_episodes_watched: list_status.num_episodes_watched,
		start_date_watched: list_status.start_date,
		finish_date_watched: list_status.finish_date,
		comments: list_status.comments,
		tags: list_status.tags ?? [],
	};
}
