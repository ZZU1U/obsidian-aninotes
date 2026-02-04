/* eslint-disable obsidianmd/ui/sentence-case */
import { Setting, Modal, App } from "obsidian";
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
		contentEl.createEl("h2", { text: "Select Property Type" });

		const typeDescriptions = {
			text: { icon: "file-text", name: "Text", description: "Plain text value. Use for single-line text like title, status, etc." },
			list: { icon: "list", name: "List", description: "Array of values. Use for multiple items like genres, tags, etc." },
			number: { icon: "hash", name: "Number", description: "Numeric value. Use for scores, ratings, episode count, etc." },
			checkbox: { icon: "check-square", name: "Checkbox", description: "Boolean value (true/false). Use for yes/no options." },
			date: { icon: "calendar", name: "Date", description: "Date value. Use for dates like start date, completion date, etc." },
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

	private getIconSvg(iconName: string): string {
		const icons: Record<string, string> = {
			"file-text": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
			"list": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
			"hash": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16"></path><path d="M4 15h16"></path><path d="M10 3v18"></path><path d="M14 3v18"></path></svg>',
			"check-square": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><polyline points="9 11 12 14 22 4"></polyline></svg>',
			"calendar": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
			"clock": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
		};
		return icons[iconName] || icons["file-text"] || "";
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
		.setName("Anime directory")
		.setDesc("Directory for anime notes")
		.addText((el) => {
			el
				.setValue(this.plugin.settings.animeNoteT.fileDir)
				.setPlaceholder("AL/Anime")
				.onChange(async (value) => {
					this.plugin.settings.animeNoteT.fileDir = value;
					await this.plugin.saveSettings();
				});
			el.inputEl.setCssProps({flex: "1", minWidth: "200px"})
		});

	new Setting(containerEl).setName("Content").setHeading()

	const descEl = containerEl.createEl("p", {
		cls: "setting-item-description",
	});
	descEl.appendChild(document.createTextNode("Anime template consists of frontmatter template and note body template.\
		For rendering template strings used "));
	descEl.createEl("a", {
		text: "Handlebars",
		href: "https://handlebarsjs.com/guide/"
	});
	descEl.appendChild(document.createTextNode(" engine so you can use Handlebars syntax.\
		In the moment plugin does not support list values so in order to make templates with arrays use {{#each}} syntax and separate values with \":::\" sequence.\
		For more info on avaliable template values see "));
	descEl.createEl("a", {
		text: "official AniList schemas",
		href: "https://studio.apollographql.com/sandbox/explorer?endpoint=https://graphql.anilist.co"
	});
	descEl.appendChild(document.createTextNode(". IMPORTANT: By default template engine generates html result so to avoid html escaping use triple curly braces {{{filter thingie}}}}."));

	const list = this.plugin.settings.animeNoteT.frontMatterT;
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
					.setPlaceholder("{{title}} or {{genres|map:name|lines}}")
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

	new Setting(containerEl).addButton((btn) => {
		btn.setButtonText("Add property").onClick(async () => {
			this.plugin.settings.animeNoteT.frontMatterT.push({
				key: "",
				value: "{{}}",
				type: "text",
			});
			await this.plugin.saveSettings();
			this.display();
		});
	});

	new Setting(containerEl)
		.setClass("man-body-template")
		.setName("Note content")
		.setDesc("Customize content of the note. Use variables to populate data from the AL API.")
		.addTextArea((ta) => {
			ta
				.setPlaceholder("{{notes}}")
				.setValue(this.plugin.settings.animeNoteT.noteBodyT)
				.onChange(async (value) => {
					this.plugin.settings.animeNoteT.noteBodyT = value;
					await this.plugin.saveSettings();
				});
			ta.inputEl.rows = 6;
			ta.inputEl.setCssProps({width: "100%"})
		});
}
