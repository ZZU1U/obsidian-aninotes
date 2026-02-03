import { AnimeModel } from "models/anime";
import Handlebars from "template/engine";

export const getNoteFilename = (media: AnimeModel) => {
    return `${media.romajiTitle || media.englishTitle || media.nativeTitle} (${media.format}).md`
}

export const getFilename = Handlebars.compile("{{safename title}} ({{capital format}}).md");