import { ApolloServer } from "@apollo/server";
import { typeDefs } from "../../../lib/graphql/schema";
import { resolvers } from "../../../lib/graphql/resolvers";
import { createContext } from "../../../lib/graphql/context";
import { NextRequest, NextResponse } from "next/server";

let server: ApolloServer | null = null;
let started = false;

async function getServer() {
  if (!server) {
    server = new ApolloServer({ typeDefs, resolvers });
  }
  if (!started) {
    await server.start();
    started = true;
  }
  return server;
}

async function handleRequest(request: NextRequest) {
  try {
    const s = await getServer();
    const body = request.method === "POST" ? await request.json() : {};
    const context = await createContext(request);
    const url = new URL(request.url);

    const httpGraphQLResponse = await s.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: request.method,
        headers: new Map(
          Array.from(request.headers.entries()).map(([k, v]) => [k, v])
        ) as any,
        body,
        search: url.search,
      },
      context: async () => context,
    });

    let responseBody = "";
    if (httpGraphQLResponse.body.kind === "complete") {
      responseBody = httpGraphQLResponse.body.string;
    } else {
      for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
        responseBody += chunk;
      }
    }

    const responseHeaders: Record<string, string> = { "Content-Type": "application/json" };
    httpGraphQLResponse.headers.forEach((value, key) => {
      if (key) responseHeaders[key] = value;
    });

    return new Response(responseBody, {
      status: httpGraphQLResponse.status || 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("GraphQL Handler Error:", err);
    return NextResponse.json({ errors: [{ message: err.message }] }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    const url = new URL(request.url);
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset=utf-8 />
  <title>Apollo Sandbox - DriveMate</title>
  <style>body { margin: 0; overflow: hidden; }</style>
</head>
<body>
  <div style="width: 100vw; height: 100vh;" id="sandbox"></div>
  <script src="https://embeddable-sandbox.lite.apollo.dev/_latest/embeddable-sandbox.umd.production.min.js"></script>
  <script>
    new window.EmbeddedSandbox({ target: '#sandbox', initialEndpoint: '${url.protocol}//${url.host}${url.pathname}' });
  </script>
</body>
</html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
