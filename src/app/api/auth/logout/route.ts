import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logout realizado com sucesso!',
  });

  // Remove o cookie auth_token
  response.cookies.delete('auth_token');

  return response;
}
