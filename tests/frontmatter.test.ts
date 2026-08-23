import { describe, expect, it } from "vitest";
import { buildFrontmatterFromEntries, coerceFrontmatterValue } from "../src/template/frontmatter";
import { REQUIRED_FIELDS } from "../src/template/constant";
import type { MediaList } from "../src/generated/anilist-schema";

const context = {
	status: "COMPLETED",
	score: 8,
	notes: null,
	media: {
		id: 151,
		title: { userPreferred: "Toriko" },
		genres: ["Action", "Adventure"],
	},
} as unknown as MediaList;

describe("required fields", () => {
	it("contains only ALId", () => {
		expect(REQUIRED_FIELDS.map((entry) => entry.key)).toEqual(["ALId"]);
	});
});

describe("coerceFrontmatterValue", () => {
	it("passes text values through untouched", () => {
		expect(coerceFrontmatterValue(8, "text")).toBe(8);
		expect(coerceFrontmatterValue("hello", "text")).toBe("hello");
	});

	it("coerces numeric strings to numbers", () => {
		expect(coerceFrontmatterValue("8.5", "number")).toBe(8.5);
	});

	it("keeps non-numeric values unchanged for number entries", () => {
		expect(coerceFrontmatterValue("n/a", "number")).toBe("n/a");
		expect(coerceFrontmatterValue(null, "number")).toBeNull();
	});

	it("coerces checkbox strings to booleans", () => {
		expect(coerceFrontmatterValue("true", "checkbox")).toBe(true);
		expect(coerceFrontmatterValue("False", "checkbox")).toBe(false);
		expect(coerceFrontmatterValue(true, "checkbox")).toBe(true);
		expect(coerceFrontmatterValue("maybe", "checkbox")).toBe("maybe");
	});

	it("wraps single values in an array for list entries", () => {
		expect(coerceFrontmatterValue("Action", "list")).toEqual(["Action"]);
	});

	it("keeps arrays as-is for list entries", () => {
		expect(coerceFrontmatterValue(["a", "b"], "list")).toEqual(["a", "b"]);
	});

	it("keeps empty values unwrapped for list entries", () => {
		expect(coerceFrontmatterValue("", "list")).toBe("");
	});

	it("passes dates through unchanged", () => {
		expect(coerceFrontmatterValue("2024-03-09", "date")).toBe("2024-03-09");
	});
});

describe("buildFrontmatterFromEntries", () => {
	it("evaluates entry expressions against the context", async () => {
		const result = await buildFrontmatterFromEntries(
			[{ key: "title", value: "media.title.userPreferred", type: "text" }],
			context,
		);
		expect(result).toEqual({ title: "Toriko" });
	});

	it("skips entries with empty keys", async () => {
		const result = await buildFrontmatterFromEntries(
			[
				{ key: "  ", value: "score", type: "number" },
				{ key: "score", value: "score", type: "number" },
			],
			context,
		);
		expect(result).toEqual({ score: 8 });
	});

	it("applies the declared type to rendered values", async () => {
		const result = await buildFrontmatterFromEntries(
			[
				{ key: "score", value: "$string(score)", type: "number" },
				{ key: "status", value: "status", type: "list" },
			],
			context,
		);
		expect(result).toEqual({ score: 8, status: ["COMPLETED"] });
	});
});
