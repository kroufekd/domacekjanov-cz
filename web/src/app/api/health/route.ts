export const dynamic = "force-static";

export function GET() {
  return Response.json({
    status: "ok",
    service: "domecek-janov",
    timestamp: new Date().toISOString(),
  });
}
