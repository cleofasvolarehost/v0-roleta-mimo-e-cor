import { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  // Middleware desabilitado - autenticação agora usa localStorage no cliente
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
