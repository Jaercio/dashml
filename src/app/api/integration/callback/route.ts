import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const ML_AUTH_URL = 'https://auth.mercadolivre.com.br';
const ML_API_URL = 'https://api.mercadolibre.com';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${origin}/dashboard/integration?error=${encodeURIComponent(msg)}`);

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) return errorRedirect(error);
    if (!code) return errorRedirect('Código de autorização não fornecido');
    if (!state) return errorRedirect('Sessão inválida - tente novamente');

    const userId = state;

    const clientIdRow = await prisma.systemSetting.findUnique({ where: { key: 'ML_CLIENT_ID' } });
    const clientSecretRow = await prisma.systemSetting.findUnique({ where: { key: 'ML_CLIENT_SECRET' } });
    if (!clientIdRow || !clientSecretRow) return errorRedirect('Credenciais do ML não configuradas');

    const clientId = clientIdRow.value;
    const clientSecret = clientSecretRow.value;
    const redirectUri = process.env.ML_REDIRECT_URI || '';

    const tokenRes = await fetch(ML_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('ML token error:', tokenRes.status, errBody);
      return errorRedirect(`Token ${tokenRes.status}: ${errBody.substring(0, 300)}`);
    }

    const tokenData = await tokenRes.json();

    const userRes = await fetch(`${ML_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) return errorRedirect('Erro ao buscar informações do usuário ML');

    const mlUser = await userRes.json();
    const sellerId = String(mlUser.id);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    const existing = await prisma.mLIntegration.findFirst({ where: { userId } });

    if (existing) {
      await prisma.mLIntegration.update({
        where: { id: existing.id },
        data: { accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token, expiresAt, sellerId },
      });
    } else {
      await prisma.mLIntegration.create({
        data: { userId, sellerId, accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token, expiresAt },
      });
    }

    return NextResponse.redirect(`${origin}/dashboard/integration?success=true`);
  } catch (err: any) {
    console.error('ML callback error:', err);
    return errorRedirect(err.message || 'Erro ao processar callback');
  }
}
