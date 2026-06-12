import { ApolloServer, HeaderMap } from "@apollo/server";
import { NextRequest } from "next/server";
import { resolvers } from "../../../graphql/resolvers";
import { getUserFromHeader, GraphQLContext } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import * as fs from "node:fs";
import * as path from "node:path";

// Load Schema SDL dynamically from the shared graphql folder
const schemaPath = path.join(process.cwd(), "graphql", "schema.graphql");
const typeDefs = fs.readFileSync(schemaPath, "utf8");

// Initialize Apollo Server
const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
});

let isServerStarted = false;

async function handleRequest(request: NextRequest) {
  // Lazily start server once (Standard Next.js Serverless Function workaround)
  if (!isServerStarted) {
    await server.start();
    isServerStarted = true;
  }

  let body: any = null;
  if (request.method === "POST") {
    try {
      body = await request.json();
    } catch (e) {
      console.warn("Failed to parse request body:", e);
    }
  }

  // Extract authentication token
  const authHeader = request.headers.get("authorization");
  const user = getUserFromHeader(authHeader);

  // Convert Web Headers to Apollo HeaderMap
  const apolloHeaders = new HeaderMap();
  request.headers.forEach((value, key) => {
    apolloHeaders.set(key, value);
  });

  // Execute the GraphQL query via Apollo's low-level HTTP execution runner
  const res = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: request.method,
      headers: apolloHeaders,
      search: request.nextUrl.search,
      body,
    },
    context: async () => ({
      prisma,
      user,
    }),
  });

  const responseHeaders = new Headers();
  res.headers.forEach((value, key) => responseHeaders.append(key, value));

  // Inject CORS values for cross-origin client usage
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (res.body.kind === "complete") {
    return new Response(res.body.string, {
      status: res.status ?? 200,
      headers: responseHeaders,
    });
  }

  const chunkedBody = res.body;
  if (chunkedBody.kind !== "chunked") {
    return new Response("Unexpected response structure", { status: 500 });
  }

  // Process stream chunk responses
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of chunkedBody.asyncIterator) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: res.status ?? 200,
    headers: responseHeaders,
  });
}

// OPTIONS method support for CORS preflight requests
export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return new Response(null, { status: 204, headers });
}

export { handleRequest as GET, handleRequest as POST };
