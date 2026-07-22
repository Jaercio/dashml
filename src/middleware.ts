import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-dashml-erp-2026-dynamic-token';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obter o token dos cookies
  const token = request.cookies.get('auth_token')?.value;

  // Definir rotas protegidas
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isApiDashboardRoute = pathname.startsWith('/api/dashboard');

  if (isDashboardRoute || isApiDashboardRoute) {
    const isApiRoute = isApiDashboardRoute;

    if (!token) {
      if (isApiRoute) {
        return NextResponse.json(
          { success: false, message: 'Não autorizado. Faça login.' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, secretKey);
      return NextResponse.next();
    } catch (error) {
      if (isApiRoute) {
        return NextResponse.json(
          { success: false, message: 'Sessão inválida ou expirada.' },
          { status: 401 }
        );
      }
      // Limpa o cookie inválido e redireciona para login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // Se o usuário já estiver logado e tentar ir para as páginas de login/register, redireciona para o dashboard
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/recover-password';
  if (isAuthPage && token) {
    try {
      await jwtVerify(token, secretKey);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (e) {
      // Ignora erro e deixa acessar a página de auth se o token for inválido
    }
  }

  return NextResponse.next();
}

// Configura em quais caminhos o middleware deve rodar
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/dashboard/:path*',
    '/login',
    '/register',
    '/recover-password',
  ],
};
