import type { RequestUrlResponse } from "obsidian";

type GraphQLResponse<T> = {
	data?: T | null;
	errors?: Array<{ message?: unknown } | null> | null;
};

/** Extracts `data` from a GraphQL response, throwing when the response reports errors. */
export function gqlData<T>(res: RequestUrlResponse): T {
	const json = res.json as GraphQLResponse<T> | null | undefined;

	if (json?.errors?.length) {
		const message = json.errors[0]?.message;
		throw new Error(`GraphQL error: ${typeof message === "string" ? message : "unknown error"}`);
	}

	if (!json || json.data == null) {
		throw new Error("GraphQL response is missing data");
	}

	return json.data;
}
