import Handlebars from "template/engine";

export const getFilename = Handlebars.compile("{{{safename media.title.userPreferred}}} ({{capital media.format}}).md");