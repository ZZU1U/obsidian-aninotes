import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "../src/tools/parsing";

describe("htmlToMarkdown", () => {
	it("converts <br> tags to newlines", () => {
		expect(htmlToMarkdown("Line1<br>Line2")).toBe("Line1\nLine2");
		expect(htmlToMarkdown("Line1<br/>Line2")).toBe("Line1\nLine2");
		expect(htmlToMarkdown("Line1<BR>Line2")).toBe("Line1\nLine2");
	});

	it("converts italic tags to single asterisks", () => {
		expect(htmlToMarkdown("<i>word</i>")).toBe("*word*");
		expect(htmlToMarkdown("<em>word</em>")).toBe("*word*");
	});

	it("converts bold tags to double asterisks", () => {
		expect(htmlToMarkdown("<b>word</b>")).toBe("**word**");
		expect(htmlToMarkdown("<strong>word</strong>")).toBe("**word**");
	});

	it("normalizes three or more newlines to two", () => {
		expect(htmlToMarkdown("a\n\n\n\nb")).toBe("a\n\nb");
	});
});
