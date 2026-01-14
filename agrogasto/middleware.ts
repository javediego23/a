import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Update session logic which handles refreshing tokens
    const { supabaseResponse, user } = await updateSession(request)

    // Protected routes logic
    const path = request.nextUrl.pathname

    // Define protected routes (adjust as needed)
    // We assume everything under (dashboard) is protected which usually maps to root / or specific paths.
    // Given the previous middleware protected '/', let's keep that logic.
    // Actually, let's protect everything EXCEPT auth routes and public assets.

    const isLoginPage = path === '/login'
    const isAuthRoute = path.startsWith('/auth') || path.startsWith('/api/auth')
    const isPublicAsset = path.includes('.') // naive check for files

    if (!user && !isLoginPage && !isAuthRoute && !isPublicAsset) {
        // If trying to access root or other protected pages without user, redirect to login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user && isLoginPage) {
        // If logged in and trying to access login, redirect to dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

import { NextResponse } from 'next/server'

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
