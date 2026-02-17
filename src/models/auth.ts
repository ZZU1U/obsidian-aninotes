export interface OAuthTokenSchema {
    access_token: string,
    refresh_token: string,
    expires_in: number,
    token_type: string
}

export interface ALOAuthDataSchema {
    url: string
}

export interface UserInfo {
    id: number,
    name: string
}