import { NextResponse } from "next/server";

// In-memory storage for the report (for demonstration purposes only)
let storedReport: any = null;

export async function GET() {
  if (!storedReport) {
    return NextResponse.json({ error: "No report available" }, { status: 404 });
  }
  return NextResponse.json(storedReport);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    storedReport = body;
    return NextResponse.json({ message: "Report stored successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Error storing report" }, { status: 500 });
  }
}
