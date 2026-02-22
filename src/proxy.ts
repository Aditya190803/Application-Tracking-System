import { NextRequest, NextResponse } from 'next/server'

import { stackServerApp } from '@/stack/server'

export async function proxy(request: NextRequest) {
  const user = await stackServerApp.getUser({ tokenStore: request })

  if (user) {
    return NextResponse.next()
  }

  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`
  const loginUrl = new URL('/handler/login', request.url)
  loginUrl.searchParams.set('after_auth_return_to', returnTo)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
