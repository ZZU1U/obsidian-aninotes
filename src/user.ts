import { requestUrl } from "obsidian";

// export interface AnimeUserStats { }

export interface UserInfo {
    id: number,
    name: string,
    picture: string,
    gender: string | null,
    birthday: string | null,
    location: string | null,
    joined_at: string,
    //anime_statistics: AnimeUserStats | null,
    time_zone: string | null,
    is_supporter: boolean | null
}

export async function getUserInfo(token: string): Promise<UserInfo | undefined> {
    const reqRes = await requestUrl({
        url: "https://api.myanimelist.net/v2/users/@me",
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        throw: false,
    });


    if (reqRes.status < 200 || reqRes.status >= 300) {
        console.error("Error", reqRes.status, reqRes.text);
        return undefined;
    }

    try {
        return await reqRes.json as UserInfo;
    } catch {
        console.error("Response was not JSON:", reqRes.text?.slice(0, 200));
        return undefined;
    }
}