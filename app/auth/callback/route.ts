import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextParam = url.searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  return NextResponse.redirect(new URL(next, url.origin));
}
