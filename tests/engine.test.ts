import { describe, expect, it } from "vitest";
import engine from "../src/template/engine";

describe("template engine", () => {
	describe("compile string coercion", () => {
		it("stringifies non-string results", async () => {
			const render = await engine.compile("1 + 1");
			expect(await render({})).toBe("2");
		});

		it("renders null and missing fields as empty strings", async () => {
			const render = await engine.compile("notes");
			expect(await render({ notes: null })).toBe("");
			expect(await render({})).toBe("");
		});
	});

	describe("$capital", () => {
		it("capitalizes the first letter and lowercases the rest", async () => {
			const render = await engine.compile('$capital("TV")');
			expect(await render({})).toBe("Tv");
		});

		it("capitalizes lowercase input", async () => {
			const render = await engine.compile("$capital(media.format)", );
			expect(await render({ media: { format: "ova" } })).toBe("Ova");
		});
	});

	describe("$safename", () => {
		it("removes characters that are invalid in filenames", async () => {
			const render = await engine.compile('$safename("a/b\\\\c:d*e?f\\"g<h>i|j")');
			expect(await render({})).toBe("abcdefghij");
		});

		it("removes brackets and hashes", async () => {
			const render = await engine.compile('$safename("Re:[Zero] #1^")');
			expect(await render({})).toBe("ReZero 1");
		});

		it("replaces a leading dot with an underscore", async () => {
			const render = await engine.compile('$safename(".hidden")');
			expect(await render({})).toBe("_hidden");
		});

		it("truncates to 245 characters", async () => {
			const render = await engine.compile("$safename(long)");
			expect((await render({ long: "a".repeat(300) })).length).toBe(245);
		});
	});

	describe("$wikilink", () => {
		it("wraps the value in double brackets", async () => {
			const render = await engine.compile('$wikilink("Berserk")');
			expect(await render({})).toBe("[[Berserk]]");
		});

		it("maps over arrays", async () => {
			const render = await engine.compileRaw('["a", "b"].$wikilink($)');
			// jsonata marks result sequences with an extra own property, so
			// copy into a plain array before comparing.
			const result = (await render({})) as string[];
			expect([...result]).toEqual(["[[a]]", "[[b]]"]);
		});
	});

	describe("$link", () => {
		it("builds a markdown link", async () => {
			const render = await engine.compile('$link("https://example.com", "Example")');
			expect(await render({})).toBe("[Example](https://example.com)");
		});

		it("returns an empty string when either part is missing", async () => {
			const render = await engine.compile('$link("", "Example")');
			expect(await render({})).toBe("");
		});
	});

	describe("$date", () => {
		it("formats a complete fuzzy date as YYYY-MM-DD", async () => {
			const render = await engine.compile('$date({"year": 2024, "month": 3, "day": 9})');
			expect(await render({})).toBe("2024-03-09");
		});

		it("returns an empty string for partial dates", async () => {
			const render = await engine.compile('$date({"year": 2024})');
			expect(await render({})).toBe("");
		});
	});

	describe("$callout", () => {
		it("renders a collapsed callout with HTML converted to markdown", async () => {
			const render = await engine.compile('$callout("summary", "Description", "Line1<br>Line2")');
			expect(await render({})).toBe("> [!summary]- Description\n> Line1\n> Line2");
		});
	});

	describe("$blockquote", () => {
		it("prefixes every line with a quote marker", async () => {
			const render = await engine.compile('$blockquote("a<br>b")');
			expect(await render({})).toBe("> a\n> b");
		});
	});

	describe("$image", () => {
		it("renders an image with alt text", async () => {
			const render = await engine.compile('$image("https://example.com/cover.jpg", "cover")');
			expect(await render({})).toBe("![cover](https://example.com/cover.jpg)");
		});

		it("falls back to the url as alt text", async () => {
			const render = await engine.compile('$image("https://example.com/cover.jpg", "")');
			expect(await render({})).toBe("![https://example.com/cover.jpg](https://example.com/cover.jpg)");
		});
	});
});
