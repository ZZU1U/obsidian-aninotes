import { ALOAuthDataSchema, OAuthTokenSchema } from "models/auth";
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from "./constant";
import { requestUrl } from "obsidian";
import { UserInfo } from "models/auth";
import { gqlData } from "tools/graphql";

export const createALOAuthURL = (): ALOAuthDataSchema => {
    const authUrl = 
        'https://anilist.co/api/v2/oauth/authorize?' +
        `client_id=${CLIENT_ID}` + 
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code`;

    return { url: authUrl };
}

export const exchangeALCode = async (code: string): Promise<OAuthTokenSchema | undefined> => {
    const response = await requestUrl({
        url: "https://anilist.co/api/v2/oauth/token",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            "grant_type": "authorization_code",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI, // http://example.com/callback
            "code": code, // The Authorization Code received previously
        })
    });

    try {
        return response.json as OAuthTokenSchema
    } catch (err) {
        console.error(err)
        return undefined;
    }
}

export const getUserInfo = async (accessToken: string): Promise<UserInfo | undefined> => {
    const query = `
    query {
        Viewer {
            id
            name
        }
    }
    `;
    const variables = { };

    const url = 'https://graphql.anilist.co',
        method = 'POST',
        headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body = JSON.stringify({
            query: query,
            variables: variables
        });

    const response = await requestUrl({
        url,
        method,
        headers,
        body,
    })

    try {
        const data = gqlData<{ Viewer: UserInfo }>(response);
        return data.Viewer;
    } catch (err) {
        console.error(err)
        return undefined;
    }
}