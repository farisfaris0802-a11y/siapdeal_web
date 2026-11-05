import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return NextResponse.redirect(new URL("/", new URL(request.url).origin), {
    status: 303,
  });
}
