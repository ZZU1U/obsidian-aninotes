export interface PKCESchema {
    verifier: string,
    challenge: string
}

export interface OAuthDataSchema {
    url: string,
    pkce: PKCESchema,
    state: string
}

export interface OAuthTokenSchema {
    access_token: string,
    refresh_token: string,
    expires_in: number,
    token_type: string
}