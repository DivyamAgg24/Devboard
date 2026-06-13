import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/src/lib/session";
import { COOKIE_NAME } from "@/src/lib/constants";

const publicRoutes = ["/", "/login", "/signup"]
const PROTECTED_ROOT = "/dashboard"

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname
    const isPublicRoute = publicRoutes.includes(path)

    const cookie = req.cookies.get(COOKIE_NAME)?.value

    const session = cookie ? await decrypt(cookie) : null

    if (!isPublicRoute && !session) {
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }

    if (isPublicRoute && session && path !== "/") {
        return NextResponse.redirect(new URL(PROTECTED_ROOT, req.nextUrl))
    }

    return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}