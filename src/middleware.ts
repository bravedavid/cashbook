import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// 登录页面不需要认证
	if (pathname === '/login') {
		return NextResponse.next();
	}

	// API 路由中的认证路由不需要认证
	if (pathname.startsWith('/api/auth/login')) {
		return NextResponse.next();
	}

	// 检查是否有 session token
	const token = request.cookies.get('session_token')?.value;

	if (!token) {
		// 如果是 API 路由，返回 401
		if (pathname.startsWith('/api/')) {
			return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
		}
		// 否则重定向到登录页
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};

