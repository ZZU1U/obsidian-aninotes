/**
 * Clipper-style template engine: {{variable}} and {{variable|filter|filter:arg}}.
 * Compatible with Obsidian Web Clipper template syntax for variables and filters.
 */

import { TEMPLATE_FILTERS } from "./filters";

/** Get nested value by path, e.g. "main_picture.medium" */
function getByPath(obj: unknown, path: string): unknown {
	if (path === "" || obj === null || obj === undefined) return obj;
	const parts = path.split(".");
	let current: unknown = obj;
	for (const key of parts) {
		if (current === null || current === undefined) return undefined;
		current = (current as Record<string, unknown>)[key];
	}
	return current;
}

/** Parse one placeholder: "title" or "genres|map:name|join:', '" */
function parsePlaceholder(placeholder: string): { path: string; filters: { name: string; arg?: string }[] } {
	const trimmed = placeholder.trim();
	const pipeIndex = trimmed.indexOf("|");
	if (pipeIndex === -1) {
		return { path: trimmed, filters: [] };
	}
	const path = trimmed.slice(0, pipeIndex).trim();
	const filterParts = trimmed.slice(pipeIndex + 1).split("|");
	const filters: { name: string; arg?: string }[] = [];
	for (const part of filterParts) {
		const colon = part.indexOf(":");
		const name = (colon === -1 ? part : part.slice(0, colon)).trim();
		const arg = colon === -1 ? undefined : part.slice(colon + 1).trim();
		if (name) filters.push({ name, arg });
	}
	return { path, filters };
}

function applyFilters(value: unknown, filters: { name: string; arg?: string }[]): string {
	let current: unknown = value;
	for (const { name, arg } of filters) {
		const fn = TEMPLATE_FILTERS[name];
		if (fn) {
			current = fn(current, arg);
		}
	}
	if (current === null || current === undefined) return "";
	if (typeof current === "string") return current;
	if (typeof current === "number" || typeof current === "boolean") return String(current);
	if (Array.isArray(current)) return current.map(String).join(", ");
	return String(current);
}

const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Render a template string with the given context.
 * - {{key}} → context[key]
 * - {{key|filter}} → apply filter to value
 * - {{key|filter:arg}} → filter with one argument (e.g. join:", ")
 * - {{key|f1|f2}} → chain filters
 */
export function renderTemplate(template: string, context: Record<string, unknown>): string {
	return template.replace(PLACEHOLDER_REGEX, (_, placeholder) => {
		const { path, filters } = parsePlaceholder(placeholder as string);
		const value = getByPath(context, path);
		return applyFilters(value, filters);
	});
}
