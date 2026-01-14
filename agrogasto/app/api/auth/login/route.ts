import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
        }

        // Create session
        const sessionData = {
            user: { id: user.id, username: user.username, role: user.role },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        const sessionToken = await encrypt(sessionData);

        const cookieStore = await cookies();
        cookieStore.set('session', sessionToken, {
            expires: sessionData.expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}
