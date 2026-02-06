import { FuzzyDate } from "generated/anilist-schema";
import Handlebars from "handlebars";

Handlebars.registerHelper('upper', function (str: string) {
  return str.toUpperCase();
})

Handlebars.registerHelper('lower', function (str: string) {
  return str.toLowerCase();
})

Handlebars.registerHelper('capital', function (str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
})

Handlebars.registerHelper('trim', function (str: string) {
  return str.trim();
})

Handlebars.registerHelper('safename', function (str: string) {
  return str
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
    .replace(/[#[\]^]/g, '') // Remove Obsidian-specific problematic characters
    .replace(/^\./, '_') // Don't start with dot
	.replace(/^\.+/, '') // Remove leading periods
	.trim()
	.slice(0, 245); // Limit length
})

Handlebars.registerHelper('wikilink', function (val: string) {
    return `[[${val}]]`;
})

Handlebars.registerHelper('link', function (url: string, face: string) {
  return `[${face}](${url})`;
})

Handlebars.registerHelper('date', function (fzDate: FuzzyDate) {
  return `${fzDate.year}-${fzDate.month}-${fzDate.day}`;
})

Handlebars.registerHelper('callout', function (type: string, title: string, content: string) {
  const lines = content.split('\n');
  return `> [!${type}]- ${title}\n` + lines.map(line => `> ${line}`).join('\n');
})

export default Handlebars