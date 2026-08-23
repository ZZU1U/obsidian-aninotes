import { Menu, Setting } from "obsidian";
import type AniNotesPlugin from "../main";
import type { SettingTab } from "../settings";
import { DEFAULT_ANIME_T, DEFAULT_MANGA_T, REQUIRED_FIELDS } from "../template/constant";
import type { FrontmatterType, NoteTemplateSettings } from "../template/models";
import type { MediaKind } from "../types";

const TYPE_OPTIONS: ReadonlyArray<{
	type: FrontmatterType;
	icon: string;
	name: string;
	description: string;
}> = [
	{ type: "text", icon: "file-text", name: "Text", description: "Plain text for values like title or status" },
	{ type: "list", icon: "list", name: "List", description: "Array of values like genres or tags" },
	{ type: "number", icon: "hash", name: "Number", description: "Numeric value like score or episode count" },
	{ type: "checkbox", icon: "check-square", name: "Checkbox", description: "Boolean value (true/false)" },
	{ type: "date", icon: "calendar", name: "Date", description: "Date value like start or completion date" },
	{ type: "datetime", icon: "clock", name: "Date & Time", description: "Date and time value for timestamps" },
];

function typeIcon(type: FrontmatterType): string {
	return TYPE_OPTIONS.find((option) => option.type === type)?.icon ?? "file-text";
}

function typeMenuTitle(name: string, description: string): DocumentFragment {
	const fragment = document.createDocumentFragment();

	const nameEl = document.createElement("span");
	nameEl.textContent = name;
	nameEl.className = "man-type-menu-name";
	fragment.appendChild(nameEl);

	const descEl = document.createElement("span");
	descEl.textContent = ` — ${description}`;
	descEl.className = "man-type-menu-desc";
	fragment.appendChild(descEl);

	return fragment;
}

/** Opens a compact menu anchored to the type button: icon + name + short description per row. */
function openTypeMenu(evt: MouseEvent, currentType: FrontmatterType, onSelect: (type: FrontmatterType) => void): void {
	const menu = new Menu();

	for (const option of TYPE_OPTIONS) {
		menu.addItem((item) => {
			item
				.setTitle(typeMenuTitle(option.name, option.description))
				.onClick(() => onSelect(option.type));

			if (option.type === currentType) {
				item.setChecked(true);
			} else {
				item.setIcon(option.icon);
			}
		});
	}

	menu.showAtMouseEvent(evt);
}

const HELPER_REFERENCE: ReadonlyArray<{ signature: string; description: string }> = [
	{ signature: "$capital(text)", description: "Capitalizes the first letter of the text." },
	{ signature: "$safename(text)", description: "Removes characters that are invalid in filenames. Use in the note name template." },
	{ signature: "$wikilink(text)", description: "Wraps the text in an Obsidian wikilink: [[text]]." },
	{ signature: "$link(url, text)", description: "Creates a markdown link: [text](url)." },
	{ signature: "$date(fuzzyDate)", description: "Formats an AniList date (startedAt, completedAt, …) as YYYY-MM-DD." },
	{ signature: "$callout(type, title, text)", description: "Creates an Obsidian callout block: > [!type]- title." },
	{ signature: "$blockquote(text)", description: "Prefixes every line with > to form a quote block." },
	{ signature: "$image(url, alt)", description: "Creates a markdown image: ![alt](url)." },
];

const TEMPLATE_EXAMPLES: ReadonlyArray<{ code: string; description: string }> = [
	{ code: "media.genres.$wikilink($)", description: "List of genres as Obsidian wikilinks (use with the list property type)." },
	{ code: '$link(media.siteUrl, "Open on AniList")', description: "Link to the entry's AniList page." },
	{ code: "$image(media.coverImage.extraLarge, media.title.userPreferred)", description: "Embed the cover image." },
	{ code: '$callout("summary", "Description", media.description)', description: "Render the description as a collapsible callout." },
	{ code: "$date(media.startDate)", description: "Start date as YYYY-MM-DD." },
];

function renderTemplateReference(containerEl: HTMLElement): void {
	const detailsEl = containerEl.createEl("details", { cls: "man-info-block" });

	const summaryEl = detailsEl.createEl("summary");
	summaryEl.createSpan({ text: "Template reference" });

	const contentEl = detailsEl.createDiv({ cls: "man-info-content" });

	contentEl.createEl("p", {
		text: "The note name template is rendered against the AniList Media object, so its fields are used directly (title.userPreferred, format, ID). Frontmatter and note body templates are rendered against the MediaList entry: entry fields (status, score, progress, notes) are used directly, while media fields need the media prefix (media.title.userPreferred). Helpers combine with regular Jsonata expressions using & for concatenation.",
	});

	contentEl.createDiv({ text: "Helpers", cls: "man-info-subheading" });
	for (const helper of HELPER_REFERENCE) {
		const rowEl = contentEl.createDiv({ cls: "man-info-helper" });
		rowEl.createEl("code", { text: helper.signature });
		rowEl.createSpan({ text: helper.description, cls: "man-info-helper-desc" });
	}

	contentEl.createDiv({ text: "Examples", cls: "man-info-subheading" });
	for (const example of TEMPLATE_EXAMPLES) {
		const rowEl = contentEl.createDiv({ cls: "man-info-example" });
		rowEl.createEl("code", { text: example.code });
		rowEl.createSpan({ text: example.description, cls: "man-info-example-desc" });
	}
}

/**
 * Renders the note template settings shared by the anime and manga tabs:
 * filename template, notes directory, frontmatter property editor and note
 * body template.
 */
export function renderMediaNoteSettings(this: SettingTab, containerEl: HTMLElement, kind: MediaKind): void {
	const plugin: AniNotesPlugin = this.plugin;
	const templates: NoteTemplateSettings = kind === "anime" ? plugin.settings.animeNoteT : plugin.settings.mangaNoteT;
	const defaults: NoteTemplateSettings = kind === "anime" ? DEFAULT_ANIME_T : DEFAULT_MANGA_T;
	const kindLabel = kind === "anime" ? "Anime" : "Manga";

	new Setting(containerEl).setName("File").setHeading();

	new Setting(containerEl)
		.setName("Note name")
		.setDesc("Template for created note filename (must end with .md). Context of this note is class media from anilist API.")
		.addText((el) => {
			el
				.setValue(templates.fileNameT)
				.setPlaceholder(defaults.fileNameT)
				.onChange(async (value) => {
					templates.fileNameT = value;
					await plugin.saveSettings();
				});
			el.inputEl.addClass("man-template-input");
		});

	new Setting(containerEl)
		.setName(`${kindLabel} directory`)
		.setDesc(`Directory for ${kind} notes. There is no template applied.`)
		.addText((el) => {
			el
				.setValue(templates.fileDir)
				.setPlaceholder(defaults.fileDir)
				.onChange(async (value) => {
					templates.fileDir = value;
					await plugin.saveSettings();
				});
			el.inputEl.addClass("man-template-input");
		});

	new Setting(containerEl).setName("Content").setHeading();

	const descEl = containerEl.createEl("p", { cls: "man-intro" });
	descEl.appendChild(document.createTextNode(`${kindLabel} template consists of frontmatter template and note body template. For rendering template strings used `));
	descEl.createEl("a", {
		text: "Jsonata",
		href: "https://docs.jsonata.org/",
	});
	descEl.appendChild(document.createTextNode(" expressions. Frontmatter list properties can return arrays directly (no special delimiters). For more info on available template values see "));
	descEl.createEl("a", {
		text: "Official anilist schemas",
		href: "https://studio.apollographql.com/sandbox/explorer?endpoint=https://graphql.anilist.co",
	});
	descEl.appendChild(document.createTextNode(". Context of all the following templates is class MediaList from AniList API."));

	renderRequiredFields(containerEl);
	renderCustomProperties(this, containerEl, templates, defaults);
	renderNoteBody(this, containerEl, templates, defaults);
	renderTemplateReference(containerEl);
}

function renderRequiredFields(containerEl: HTMLElement): void {
	containerEl.createEl("h3", { text: "Required properties (always included)", cls: "man-section-label" });
	const groupEl = containerEl.createDiv({ cls: "man-prop-group" });

	for (const entry of REQUIRED_FIELDS) {
		const row = groupEl.createDiv({ cls: "man-frontmatter-row man-required-row" });
		// Spacer keeping required rows aligned with the drag handles above.
		row.createDiv({ cls: "man-drag-spacer" });

		new Setting(row)
			.setClass("man-compact-setting")
			.addText((text) => {
				text.setValue(entry.key);
				text.inputEl.disabled = true;
			})
			.addText((text) => {
				text.setValue(entry.value);
				text.inputEl.disabled = true;
			})
			.addButton((btn) => {
				btn.setIcon(typeIcon(entry.type));
				btn.setTooltip(`Required: ${entry.type}`);
				btn.buttonEl.disabled = true;
			});
	}
}

function renderCustomProperties(
	tab: SettingTab,
	containerEl: HTMLElement,
	templates: NoteTemplateSettings,
	defaults: NoteTemplateSettings,
): void {
	const plugin = tab.plugin;
	const list = templates.frontMatterT;

	containerEl.createEl("h3", { text: "Custom properties", cls: "man-section-label" });
	const groupEl = containerEl.createDiv({ cls: "man-prop-group" });

	if (list.length === 0) {
		const emptyState = groupEl.createDiv({ cls: "man-empty-state" });
		emptyState.createEl("p", {
			text: "No custom properties yet. Click 'add property' to create one.",
			cls: "setting-item-description",
		});
	}

	// Shared across rows so the drop target knows the origin of the drag.
	let dragFromIndex: number | null = null;

	for (let i = 0; i < list.length; i++) {
		const entry = list[i];
		if (!entry) continue;

		const row = groupEl.createDiv({ cls: "man-frontmatter-row" });
		row.setAttribute("data-index", String(i));
		row.draggable = true;

		const dragHandle = row.createDiv({ cls: "man-drag-handle" });
		dragHandle.textContent = "⋮⋮";

		row.addEventListener("dragstart", (e) => {
			dragFromIndex = i;
			row.classList.add("man-dragging");
			e.dataTransfer?.setData("text/plain", String(i));
		});

		row.addEventListener("dragend", () => {
			dragFromIndex = null;
			row.classList.remove("man-dragging");
		});

		row.addEventListener("dragover", (e) => {
			e.preventDefault();
			if (dragFromIndex !== null && dragFromIndex !== i) {
				row.classList.add("man-drag-over");
			}
		});

		row.addEventListener("dragleave", () => {
			row.classList.remove("man-drag-over");
		});

		row.addEventListener("drop", (e) => {
			e.preventDefault();
			row.classList.remove("man-drag-over");
			dragFromIndex = null;

			const fromIndex = Number.parseInt(e.dataTransfer?.getData("text/plain") ?? "-1", 10);
			if (!Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex === i) return;

			const moved = list[fromIndex];
			if (!moved) return;

			list.splice(fromIndex, 1);
			list.splice(i, 0, moved);
			void plugin.saveSettings().then(() => tab.display());
		});

		new Setting(row)
			.setClass("man-compact-setting")
			.addText((text) => {
				text
					.setPlaceholder("Property name")
					.setValue(entry.key)
					.onChange(async (value) => {
						entry.key = value;
						await plugin.saveSettings();
					});
				text.inputEl.addClass("man-prop-key");
			})
			.addText((text) => {
				text
					.setPlaceholder("Example: media.title.romaji or status")
					.setValue(entry.value)
					.onChange(async (value) => {
						entry.value = value;
						await plugin.saveSettings();
					});
				text.inputEl.addClass("man-prop-value");
			})
			.addButton((btn) => {
				btn
					.setIcon(typeIcon(entry.type))
					.setTooltip(`Type: ${entry.type}. Click to change.`)
					.onClick((evt) => {
						openTypeMenu(evt, entry.type, (newType) => {
							if (newType === entry.type) return;
							entry.type = newType;
							void plugin.saveSettings().then(() => tab.display());
						});
					});
			})
			.addButton((btn) => {
				btn.setIcon("x").onClick(async () => {
					list.splice(i, 1);
					await plugin.saveSettings();
					tab.display();
				});
			});
	}

	const footerEl = groupEl.createDiv({ cls: "man-prop-group-footer" });
	footerEl.createEl("button", { text: "Add property", cls: "mod-cta" }).onclick = async () => {
		list.push({ key: "", value: "", type: "text" });
		await plugin.saveSettings();
		tab.display();
	};
	footerEl.createEl("button", { text: "Reset properties" }).onclick = async () => {
		templates.frontMatterT = defaults.frontMatterT.map((entry) => ({ ...entry }));
		await plugin.saveSettings();
		tab.display();
	};
}

function renderNoteBody(
	tab: SettingTab,
	containerEl: HTMLElement,
	templates: NoteTemplateSettings,
	defaults: NoteTemplateSettings,
): void {
	new Setting(containerEl)
		.setClass("man-body-template")
		.setName("Note content")
		.setDesc("Customize content of the note. Use variables to populate data from the anilist API.")
		.addTextArea((ta) => {
			ta
				.setPlaceholder(defaults.noteBodyT)
				.setValue(templates.noteBodyT)
				.onChange(async (value) => {
					templates.noteBodyT = value;
					await tab.plugin.saveSettings();
				});
			ta.inputEl.rows = 6;
			ta.inputEl.addClass("man-body-input");
		});
}
