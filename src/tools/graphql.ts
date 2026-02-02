import { RequestUrlResponse } from "obsidian";

type GraphQLResponse<T> = {
    data: T;
    errors?: unknown;
};

export function gqlData<T>(res: RequestUrlResponse): T {
    const json = (res.json as GraphQLResponse<T>)

    if (!json || json.data == null) {
        throw new Error("GraphQL response missing data");
    }

    return (res.json as GraphQLResponse<T>).data;
}