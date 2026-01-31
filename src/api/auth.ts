import crypto from "crypto";
import { requestUrl } from "obsidian";
import { PKCESchema, OAuthDataSchema, OAuthTokenSchema } from "models/auth";
import { REDIRECT_URI, MAL_CLIENT_ID } from "./constant";

export function openInBrowser(url: string): void {
	try {
		const { shell } = require("electron") as { shell: { openExternal: (url: string) => Promise<void> } };
		void shell.openExternal(url);
	} catch {
		window.open(url, "_blank", "noopener");
	}
}

function generatePKCE(): PKCESchema {
  const verifier = crypto.randomBytes(48).toString("base64url");
  return { verifier, challenge: verifier };
}

export const createOAuthURL = (): OAuthDataSchema => {
    const pkce = generatePKCE();
    const state = crypto.randomBytes(16).toString("hex");

    const authUrl =
        "https://myanimelist.net/v1/oauth2/authorize" +
        "?response_type=code" +
        `&client_id=${MAL_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&code_challenge=${encodeURIComponent(pkce.challenge)}` +
        `&state=${encodeURIComponent(state)}` +
        "&code_challenge_method=plain";

    return {
        url: authUrl,
        pkce,
        state
    };
}

export async function serviceAuth(authUrl: OAuthDataSchema, code: string): Promise<OAuthTokenSchema | undefined> {
    const body = new URLSearchParams({
        client_id: MAL_CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: authUrl.pkce.verifier,
    }).toString();

    const tokenRes = await requestUrl({
        url: "https://myanimelist.net/v1/oauth2/token",
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        throw: false,
    });

    if (tokenRes.status < 200 || tokenRes.status >= 300) {
        console.error("Token error", tokenRes.status, tokenRes.text);
        return undefined;
    }

    try {
        return await tokenRes.json;
    } catch {
        console.error("Token response was not JSON:", tokenRes.text?.slice(0, 200));
        return undefined;
    }
}

export async function updateToken(refresh_token: string): Promise<OAuthTokenSchema | undefined> {
    const body = new URLSearchParams({
        client_id: MAL_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token
    }).toString();

    const tokenRes = await requestUrl({
        url: "https://myanimelist.net/v1/oauth2/token",
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        throw: false,
    });

    if (tokenRes.status < 200 || tokenRes.status >= 300) {
        console.error("Token error", tokenRes.status, tokenRes.text);
        return undefined;
    }

    try {
        return await tokenRes.json;
    } catch {
        console.error("Token response was not JSON:", tokenRes.text?.slice(0, 200));
        return undefined;
    } 
}