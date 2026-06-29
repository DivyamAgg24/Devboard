import "server-only"
import { cookies } from "next/headers"
import { db } from "@/src/lib/prisma"
import { decrypt, encrypt } from "@/src/lib/session"
import { COOKIE_NAME } from "@/src/lib/constants"

export async function setSessionCookie(cookieName: string, encryptedSessionId: string, expiresAt: Date) {
    const cookieStore = await cookies()

    cookieStore.set(cookieName, encryptedSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: expiresAt,
        path: "/",
    });
}

export async function createSession(id: string) {
    const expiresAt = new Date(Date.now() + Number(process.env.SESSION_COOKIE_DURATION) * 24 * 60 * 60 * 1000)
    const session = await db.session.create({
        data: {
            userId: id,
            expiresAt
        }
    })

    const encryptedSessionId = await encrypt(session.id)

    await setSessionCookie(COOKIE_NAME, encryptedSessionId, expiresAt)
}

export async function getSession() {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(COOKIE_NAME)
    if (!cookie?.value) { return { user: null } }
    
    const sessionId = await decrypt(cookie.value)
    if (!sessionId) { return { user: null } }

    const session = await db.session.findUnique({
        where: {
            id: sessionId
        },
        select: {
            id: true,
            userId: true,
            expiresAt: true
        }
    })
    if (!session) { await deleteSession(); return { user: null } }
    if (session.expiresAt < new Date()) {
        await db.session.delete({ where: { id: sessionId } })
        cookieStore.delete(COOKIE_NAME);
        return { user: null }
    }
    return { user: { id: session.userId } }
}

export async function deleteSession() {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(COOKIE_NAME)
    if (cookie?.value) {
        const sessionId = await decrypt(cookie.value);
        if (sessionId) {
            await db.session.deleteMany({ where: { id: sessionId } }).catch(() => { });
        }
    }

    cookieStore.delete(COOKIE_NAME);
}

export async function deleteAllSessions(userId: string): Promise<void> {
    await db.session.deleteMany({ where: { userId } });
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getGithubSession() {
    
    const session = await getSession()
    if (!session || !session.user) {
        return null
    }
    
    const gitHubSession = await db.oAuthConnection.findUnique({
        where: {
            userId_provider: {
                userId: session.user.id,
                provider: "GitHub"
            }
        }
    })

    if(!gitHubSession){
        return null
    }

    return {success: true, token: gitHubSession.accessToken}
}