import { describe, expect, it } from "vitest";
import { gqlData } from "../src/tools/graphql";
import type { RequestUrlResponse } from "obsidian";

function fakeResponse(json: unknown): RequestUrlResponse {
	return { json } as unknown as RequestUrlResponse;
}

describe("gqlData", () => {
	it("returns the data payload", () => {
		expect(gqlData<{ value: number }>(fakeResponse({ data: { value: 1 } }))).toEqual({ value: 1 });
	});

	it("throws with the first error message when errors are present", () => {
		expect(() =>
			gqlData(fakeResponse({ data: null, errors: [{ message: "Too Many Requests." }] })),
		).toThrow("GraphQL error: Too Many Requests.");
	});

	it("throws when data is missing without errors", () => {
		expect(() => gqlData(fakeResponse({}))).toThrow("GraphQL response is missing data");
	});

	it("throws when the body is not an object", () => {
		expect(() => gqlData(fakeResponse(null))).toThrow("GraphQL response is missing data");
	});
});
