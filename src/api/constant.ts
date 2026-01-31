export const MAL_CLIENT_ID = "3a42cd4b7da580e156f3e18c898993da";
export const REDIRECT_URI = "obsidian://man-revive-sync/mal";

/** Fields supported by the user animelist endpoint (related_anime/related_manga are not returned there). */
export const MAL_ANIMELIST_FIELDS =
    "list_status,genres,studios,synopsis,start_date,end_date,mean,rank,popularity,num_episodes,start_season,broadcast,source,average_episode_duration,rating,alternative_titles,main_picture,media_type,status,state";

/** Fields for a single anime from GET /anime/{id}; includes related_anime and related_manga. */
export const MAL_ANIME_DETAIL_FIELDS =
    "related_anime,related_manga,recommendations,id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_episodes,start_season,broadcast,source,average_episode_duration,rating,genres,studios,media_type,status,state";