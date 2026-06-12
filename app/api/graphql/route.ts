import { ApolloServer } from "@apollo/server";
import { typeDefs } from "../../../lib/graphql/schema";
import { resolvers } from "../../../lib/graphql/resolvers";
import { createContext } from "../../../lib/graphql/context";
import { NextRequest, NextResponse } from "next/server";

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

let handler: any;

async function getHandler() {
  if (!handler) {
    await server.start();

    handler = async (req: NextRequest) => {
      try {
        const body = await req.json();
        const context = await createContext(req);

        const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
          httpGraphQLRequest: {
            method: req.method,
            headers: new Map(
              Array.from(req.headers.entries()).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])
            ) as any,
            body,
            search: new URL(req.url).search,
          },
          context: async () => context,
        });

        const responseHeaders: Record<string, string> = {};
        httpGraphQLResponse.headers.forEach((value, key) => {
          if (key) responseHeaders[key] = value;
        });

        let responseBody = "";
        if (httpGraphQLResponse.body.kind === "complete") {
          responseBody = httpGraphQLResponse.body.string;
        } else {
          for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
            responseBody += chunk;
          }
        }

        return new Response(responseBody, {
          status: httpGraphQLResponse.status || 200,
          headers: {
            "Content-Type": "application/json",
            ...responseHeaders,
          },
        });
      } catch (err: any) {
        console.error("GraphQL Handler Error:", err);
        return NextResponse.json({ errors: [{ message: err.message }] }, { status: 500 });
      }
    };
  }
  return handler;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const accept = request.headers.get("accept") || "";

    if (accept.includes("text/html")) {
      // Return Apollo Sandbox html for documentation and testing
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset=utf-8 />
  <title>Apollo Sandbox - DriveMate</title>
  <link rel="icon" href="https://embeddable-sandbox.lite.apollo.dev/_latest/favicon.ico" />
  <style>
    body {
      margin: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div style="width: 100vw; height: 100vh;" id="sandbox"></div>
  <script src="https://embeddable-sandbox.lite.apollo.dev/_latest/embeddable-sandbox.umd.production.min.js"></script>
  <script>
    new window.EmbeddedSandbox({
      target: '#sandbox',
      initialEndpoint: '${url.protocol}//${url.host}${url.pathname}',
    });
  </script>
</body>
</html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Direct Apollo query via GET (e.g. queries)
    const context = await createContext(request);
    await server.start();
    const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: "GET",
        headers: new Map(
          Array.from(request.headers.entries()).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])
        ) as any,
        body: {},
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
    return new Response(responseBody, {
      status: httpGraphQLResponse.status || 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json({ errors: [{ message: err.message }] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const h = await getHandler();
  return h(request);
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
