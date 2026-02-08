import { Setting, Modal, App } from "obsidian";
import { DEFAULT_ANIME_T, REQUIRED_FIELDS } from "template/constant";
import type { SettingTab } from "../settings";

class TypeSelectionModal extends Modal {
	private onSelect: (type: "text" | "list" | "number" | "checkbox" | "date" | "datetime") => void;
	private currentType: "text" | "list" | "number" | "checkbox" | "date" | "datetime";

	constructor(app: App, currentType: "text" | "list" | "number" | "checkbox" | "date" | "datetime", onSelect: (type: "text" | "list" | "number" | "checkbox" | "date" | "datetime") => void) {
		super(app);
		this.currentType = currentType;
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Select property type" });

		const typeDescriptions = {
			text: { icon: "file-text", name: "Text", description: "Plain text value. Use for single-line text like title, status" },
			list: { icon: "list", name: "List", description: "Array of values. Use for multiple items like genres, tags" },
			number: { icon: "hash", name: "Number", description: "Numeric value. Use for scores, ratings, episode count" },
			checkbox: { icon: "check-square", name: "Checkbox", description: "Boolean value (true/false). Use for yes/no options." },
			date: { icon: "calendar", name: "Date", description: "Date value. Use for dates like start date, completion date" },
			datetime: { icon: "clock", name: "Date & Time", description: "Date and time value. Use for timestamps with time." }
		};

		Object.entries(typeDescriptions).forEach(([typeKey, info]) => {
			const type = typeKey as "text" | "list" | "number" | "checkbox" | "date" | "datetime";
			const optionEl = contentEl.createDiv({ cls: "man-type-option" });
			
			if (this.currentType === type) {
				optionEl.addClass("man-type-option-selected");
			}

			const iconEl = optionEl.createDiv({ cls: "man-type-icon" });
			const icon = iconEl.createSpan({ cls: `lucide-${info.icon}` });
			icon.setCssProps({ width: "16px", height: "16px" });

			const textEl = optionEl.createDiv({ cls: "man-type-text" });
			textEl.createEl("div", { text: info.name, cls: "man-type-name" });
			textEl.createEl("div", { text: info.description, cls: "man-type-description" });

			optionEl.addEventListener("click", () => {
				this.onSelect(type);
				this.close();
			});

			optionEl.setCssProps({
				padding: "12px",
				margin: "4px 0",
				border: "1px solid var(--background-modifier-border)",
				borderRadius: "6px",
				cursor: "pointer",
				display: "flex",
				alignItems: "flex-start",
				gap: "12px",
				transition: "all 0.2s ease"
			});

			if (this.currentType === type) {
				optionEl.setCssProps({
					backgroundColor: "var(--interactive-accent)",
					color: "var(--text-on-accent)",
					borderColor: "var(--interactive-accent)"
				});
			}

			optionEl.addEventListener("mouseenter", () => {
				if (this.currentType !== type) {
					optionEl.setCssProps({
						backgroundColor: "var(--background-modifier-hover)"
					});
				}
			});

			optionEl.addEventListener("mouseleave", () => {
				if (this.currentType !== type) {
					optionEl.setCssProps({
						backgroundColor: "transparent"
					});
				}
			});
		});

		// Add CSS for the modal content
		contentEl.setCssProps({
			padding: "20px"
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export function renderAnime(this: SettingTab, containerEl: HTMLElement) {
	new Setting(containerEl).setName("File").setHeading()
	//containerEl.createEl("h2", { text: "Anime note" });
	new Setting(containerEl)
		.setName("Note name")
		.setDesc("Template for created note filename (must end with .md). Context of this note is class media from anilist API.")
		.addText((el) => {
			el
				.setValue(this.plugin.settings.animeNoteT.fileNameT)
				.setPlaceholder(DEFAULT_ANIME_T.fileNameT)
				.onChange(async (value) => {
					this.plugin.settings.animeNoteT.fileNameT = value;
					await this.plugin.saveSettings();
				});
			el.inputEl.setCssProps({flex: "1", minWidth: "200px", maxWidth: "400px"})
		});

	new Setting(containerEl)
		.setName("Anime directory")
		.setDesc("Directory for anime notes. There is no template applied.")
		.addText((el) => {
			el
				.setValue(this.plugin.settings.animeNoteT.fileDir)
				.setPlaceholder(DEFAULT_ANIME_T.fileDir)
				.onChange(async (value) => {
					this.plugin.settings.animeNoteT.fileDir = value;
					await this.plugin.saveSettings();
				});
			el.inputEl.setCssProps({flex: "1", minWidth: "200px", maxWidth: "400px"})
		});

	new Setting(containerEl).setName("Content").setHeading()

	const descEl = containerEl.createEl("p", {
		cls: "setting-item-description",
	});
	descEl.appendChild(document.createTextNode("Anime template consists of frontmatter template and note body template. For rendering template strings used "));
	descEl.createEl("a", {
		text: "Jsonata",
		href: "https://docs.jsonata.org/"
	});
	descEl.appendChild(document.createTextNode(" expressions. Frontmatter list properties can return arrays directly (no special delimiters). For more info on available template values see "));
	descEl.createEl("a", {
		text: "Official anilist schemas",
		href: "https://studio.apollographql.com/sandbox/explorer?endpoint=https://graphql.anilist.co"
	});
	descEl.appendChild(document.createTextNode(". Context of all the following templates is class MediaList from Anilist API."));

	// Display required fields (non-editable, non-draggable)
	const requiredContainer = containerEl.createDiv({ cls: "man-required-fields" });
	requiredContainer.createEl("h3", { text: "Required properties (always included)", cls: "man-required-heading" });
	
	for (const entry of REQUIRED_FIELDS) {
		const row = requiredContainer.createDiv({ cls: "man-frontmatter-row man-required-row" });

		// Spacer for drag handle alignment
		const dragSpacer = row.createDiv({ cls: "man-drag-spacer" });
		dragSpacer.setCssProps({
			padding: "0 6px",
			width: "20px",
			height: "16px"
		});

		// Use Setting component for consistent styling
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
				// Set icon based on type
				const iconMap: Record<string, string> = {
					"text": "file-text",
					"list": "list",
					"number": "hash",
					"checkbox": "check-square",
					"date": "calendar",
					"datetime": "clock"
				};
				
				btn.setIcon(iconMap[entry.type] || "file-text");
				btn.setTooltip(`Required: ${entry.type}`);
				btn.buttonEl.disabled = true;
			});
	}

	// User-configurable properties
	const userPropsHeading = containerEl.createEl("h3", { text: "Custom properties", cls: "man-user-props-heading" });
	userPropsHeading.setCssProps({
		marginTop: "20px",
		marginBottom: "8px"
	});

	const list = this.plugin.settings.animeNoteT.frontMatterT;
	
	if (list.length === 0) {
		const emptyState = containerEl.createDiv({ cls: "man-empty-state" });
		emptyState.createEl("p", { 
			text: "No custom properties yet. Click 'add property' to create one.",
			cls: "setting-item-description"
		});
		emptyState.setCssProps({
			textAlign: "center",
			padding: "20px",
			color: "var(--text-muted)",
			fontStyle: "italic"
		});
	}
	
	for (let i = 0; i < list.length; i++) {
		const entry = list[i];
		if (!entry) continue;
		const row = containerEl.createDiv({ cls: "man-frontmatter-row" });
		row.setAttribute("data-index", i.toString());
		row.draggable = true;
		
		// Drag handle
		const dragHandle = row.createDiv({ cls: "man-drag-handle" });
		dragHandle.textContent = "⋮⋮";
		dragHandle.setCssProps({
			cursor: "grab",
			padding: "0 6px",
			color: "var(--text-muted)",
			userSelect: "none",
			fontSize: "10px"
		});
		
		let draggedIndex: number | null = null;
		
		// Drag and drop events
		row.addEventListener("dragstart", (e) => {
			draggedIndex = i;
			row.classList.add("man-dragging");
			e.dataTransfer?.setData("text/plain", i.toString());
			dragHandle.setCssProps({ cursor: "grabbing" });
		});
		
		row.addEventListener("dragend", () => {
			row.classList.remove("man-dragging");
			dragHandle.setCssProps({ cursor: "grab" });
			draggedIndex = null;
		});
		
		row.addEventListener("dragover", (e) => {
			e.preventDefault();
			if (draggedIndex !== null && draggedIndex !== i) {
				row.classList.add("man-drag-over");
			}
		});
		
		row.addEventListener("dragleave", () => {
			row.classList.remove("man-drag-over");
		});
		
		row.addEventListener("drop", (e) => {
			e.preventDefault();
			row.classList.remove("man-drag-over");
			
			const fromIndex = parseInt(e.dataTransfer?.getData("text/plain") || "-1");
			const toIndex = i;
			
			if (fromIndex !== -1 && fromIndex !== toIndex) {
				// Reorder the array
				const movedItem = this.plugin.settings.animeNoteT.frontMatterT[fromIndex];
				if (movedItem) {
					this.plugin.settings.animeNoteT.frontMatterT.splice(fromIndex, 1);
					this.plugin.settings.animeNoteT.frontMatterT.splice(toIndex, 0, movedItem);
					
					void this.plugin.saveSettings().then(() => {
						this.display();
					});
				}
			}
		});
		

		new Setting(row)
			.setClass("man-compact-setting")
			.addText((text) => {
				text
					.setPlaceholder("Property name")
					.setValue(entry.key)
					.onChange(async (value) => {
						entry.key = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.setCssProps({minWidth: "120px", flex: "0 0 120px"});
			})
			.addText((text) => {
				text
					.setPlaceholder("Example: media.title.romaji or status")
					.setValue(entry.value)
					.onChange(async (value) => {
						entry.value = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.setCssProps({flex: "1", minWidth: "180px"});
			})
			.addButton((btn) => {
				// Set icon based on current type
				const iconMap: Record<string, string> = {
					"text": "file-text",
					"list": "list",
					"number": "hash",
					"checkbox": "check-square",
					"date": "calendar",
					"datetime": "clock"
				};
				
				btn.setIcon(iconMap[entry.type] || "file-text");
				btn.setTooltip(`Type: ${entry.type}. Click to change.`);
				
				btn.onClick(() => {
					const modal = new TypeSelectionModal(this.app, entry.type, (newType) => {
						entry.type = newType;
						void this.plugin.saveSettings().then(() => {
							this.display();
						});
					});
					modal.open();
				});
			})
			.addButton((btn) => {
				btn.setIcon("x").onClick(async () => {
					this.plugin.settings.animeNoteT.frontMatterT.splice(i, 1);
					await this.plugin.saveSettings();
					this.display();
				});
			});
	}

	const buttonContainer = containerEl.createDiv({ cls: "man-add-button-container" });
	const addButton = buttonContainer.createEl("button", { 
		text: "Add property",
		cls: "mod-cta"
	});
	addButton.onclick = async () => {
		this.plugin.settings.animeNoteT.frontMatterT.push({
			key: "",
			value: "",
			type: "text",
		});
		await this.plugin.saveSettings();
		this.display();
	};

	const resetButton = buttonContainer.createEl("button", { 
		text: "Reset properties"
	});
	resetButton.onclick = async () => {
		this.plugin.settings.animeNoteT.frontMatterT = [...DEFAULT_ANIME_T.frontMatterT];
		await this.plugin.saveSettings();
		this.display();
	};

	buttonContainer.setCssProps({
		margin: "12px",
		textAlign: "left",
		display: "flex",
		gap: "8px"
	});

	new Setting(containerEl)
		.setClass("man-body-template")
		.setName("Note content")
		.setDesc("Customize content of the note. Use variables to populate data from the anilist API.")
		.addTextArea((ta) => {
			ta
				.setPlaceholder(DEFAULT_ANIME_T.noteBodyT)
				.setValue(this.plugin.settings.animeNoteT.noteBodyT)
				.onChange(async (value) => {
					this.plugin.settings.animeNoteT.noteBodyT = value;
					await this.plugin.saveSettings();
				});
			ta.inputEl.rows = 6;
			ta.inputEl.setCssProps({width: "100%"})
		});
}
