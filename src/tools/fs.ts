import { AnimeModel } from "models/anime";

export const getNoteFilename = (media: AnimeModel) => {
    return `${media.romajiTitle || media.englishTitle || media.nativeTitle} (${media.format}).md`
}