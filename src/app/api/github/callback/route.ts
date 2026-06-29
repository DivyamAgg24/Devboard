// app/api/github/callback/route.ts
import { NextResponse } from "next/server";
import { db } from "@/src/lib/prisma";
import { encryptToken } from "@/src/lib/crypto";
import { getSession } from "@/src/utils/session";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const userId = searchParams.get("state");
    const scope = searchParams.get("scope")
    const session = await getSession()
    if (!session || !session.user){
        return NextResponse.json({error: "UNAUTHORIZED", status: 401})
    }
    if (!code || !userId ) {
        return NextResponse.redirect("/?error=github_failed");
    }
    if (userId !== session.user.id){
        return NextResponse.json({error: "MISMATCHING STATE", status: 401});
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            // redirect_uri: process.env.GITHUB_REDIRECT_URI,
        }),
    });

    const tokenData = await tokenRes.json();
    console.log("Tokendata: ", tokenData)
    if (tokenData.error || !tokenData.access_token) {
        return NextResponse.redirect("/?error=github_token_failed");
    }

    // Fetch GitHub username
    const githubUser = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    }).then((r) => r.json());


    // Store token against your user
    const connection = await db.oAuthConnection.upsert({
        where: { userId_provider: {userId, provider: "GitHub"} },
        update: {
        },
        create: {
            userId,
            provider: "GitHub",
            scope: tokenData.scope,
            accessToken: tokenData.access_token
        },
        select: {
            id: true,
            userId: true
        }
    });


    return NextResponse.redirect("http://localhost:3000/dashboard");
}