import { getSession } from "@/src/utils/session"
import { NextResponse } from "next/server"


export async function GET(req: Request) {
    const session = await getSession()
    if (!session || !session.user){
        return NextResponse.json({error: "UNAUTHORIZED", status: 401})
    }

    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        redirect_uri: process.env.GITHUB_REDIRECT_URI!,
        scope: "read:user repo",
        state: session.user.id
    });

    return NextResponse.redirect(
        `https://github.com/login/oauth/authorize?${params}`
    );
}