import { Hono } from "hono";
import { renderer } from "./renderer";
import {
  RssFeedListResponseSchema,
  getChannelsFromUrlPublic,
} from "./parse-feeds";
import { Page } from "./ui";
import {
  asNumber,
  enumerate,
  fetchChannel,
  getDocumentQuery,
  getIsRssChannel,
  toUrl,
} from "./utils";
import {
  getFeedExtensions,
  getHash,
  parseFeedToJson,
  RssFeedResponseSchema,
} from "./parse-feed-to-json";
import { logger } from "hono/logger";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import { cors } from "hono/cors";
import { resolver, validator } from "hono-openapi/valibot";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { prettyJSON } from "hono/pretty-json";
import { swaggerUI } from "@hono/swagger-ui";

const app = new Hono();

app.use(renderer);
app.use(logger());
app.use(cors());
app.use(prettyJSON());

app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

export const routes = enumerate([
  "/",
  "/json",
  "/json-feed",
  "/__schema",
  "/__openapi",
  "/__openapi_ui",
]);

app.get(routes["/"], async (c) => {
  const urlParam = c.req.query("feed");

  const feedUrl = toUrl(urlParam);

  c.res.headers.append(
    "Link",
    '<https://fonts.googleapis.com>; rel="preconnect"',
  );

  return c.render(
    <Page
      result={
        urlParam
          ? {
              urlParam,
              feeds: await feedUrl.match(
                (validUrl) =>
                  getChannelsFromUrlPublic(validUrl, c.req.raw.signal).then(
                    (r) => r.feeds,
                  ),
                () => [],
              ),
            }
          : null
      }
      context={c}
    />,
  );
});

app.get(
  routes["/json"],
  describeRoute({
    description: "Get list of feeds found on given url",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": { schema: resolver(RssFeedListResponseSchema) },
        },
      },
      400: {
        description: "Invalid url format",
        content: {
          "application/json": {
            schema: resolver(v.object({ error: v.string() })),
          },
        },
      },
    },
  }),
  validator("query", v.object({ feed: v.string() })),
  async (c) => {
    const urlParam = toUrl(c.req.valid("query").feed);

    if (urlParam.isErr()) {
      return c.json({ error: "invalid url format" }, { status: 400 });
    }

    return c.json(
      await getChannelsFromUrlPublic(urlParam.value, c.req.raw.signal),
    );
  },
);

app.get(
  routes["/json-feed"],
  describeRoute({
    description: "Parse existing feed to json response",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": { schema: resolver(RssFeedResponseSchema) },
        },
        headers: {
          "x-last-build-date": {
            description: "parsed last build date of the original feed",
          },
          "x-feed-hash": {
            description:
              "hash of the parsed feed produced from last build date and item data",
          },

          "cache-control": {
            description: "cache control header derived from feed ttl ",
          },
          etag: { example: `W/"<x-feed-hash value>"` },
        },
      },
      400: {
        description: "Parse failed",
        content: {
          "application/json": {
            schema: resolver(v.object({ error: v.string() })),
          },
        },
      },
      304: {
        description:
          "Conditional request response - caller has the latest version of the feed",
      },
    },
  }),
  validator(
    "query",
    v.object({ feed: v.string(), disableExtensions: v.optional(v.string()) }),
  ),
  async (c) => {
    const queryParams = c.req.valid("query");
    const feedUrl = toUrl(queryParams.feed);
    if (feedUrl.isErr()) {
      return c.json({ error: "invalid url format" }, { status: 400 });
    }

    const feedXml = await fetchChannel(feedUrl.value, c.req.raw.signal);

    if (feedXml.isErr()) {
      return c.json({ error: "failed to fetch from url" }, { status: 400 });
    }

    const query = getDocumentQuery(feedXml.value);

    if (!getIsRssChannel(query)) {
      return c.json({ error: "is not valid rss feed" }, { status: 400 });
    }

    const parsed = parseFeedToJson(query);

    if (parsed.isErr()) {
      return c.json({ error: "could not parse rss feed" }, { status: 400 });
    }

    const extensions =
      queryParams.disableExtensions === undefined
        ? await getFeedExtensions(parsed.value, feedUrl.value, c.req.raw.signal)
        : undefined;
    if (extensions) {
      parsed.value.extensions = { imageUrl: extensions?.channelImage };
    }

    const ttl = asNumber(parsed.value.ttl);
    const hash = await getHash(parsed.value);

    const responseHeaders = {
      // Provide feed info in headers so that consumer can avoid reading body of the response
      "x-last-build-date": parsed.value.lastBuildDate ?? "",
      // todo: leave only etag?
      "x-feed-hash": hash,

      "cache-control": `public, max-age=${(ttl ?? 0) / 60}`,
      etag: `W/"${hash}"`,
    };

    if (c.req.header("if-none-match") === responseHeaders.etag) {
      return c.newResponse(null, 304, responseHeaders);
    }

    return c.json(
      { feed: parsed.value },
      {
        headers: responseHeaders,
      },
    );
  },
);

app.get(
  routes["/__openapi"],
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Does it RSS API",
        version: "1.0.0",
      },
      servers: [
        { url: "https://does-it-rss.com", description: "Main service" },
      ].concat(
        import.meta.env.DEV
          ? {
              url: `http://0.0.0.0:5173`,
              description: "Local",
            }
          : [],
      ),
    },
  }),
);

app.get(routes["/__openapi_ui"], swaggerUI({ url: routes["/__openapi"] }));

const ApiJsonSchema = v.object({
  [routes["/json"]]: v.object({
    response: RssFeedListResponseSchema,
    search: v.object({ feed: v.string() }),
  }),
  [routes["/json-feed"]]: v.object({
    response: RssFeedResponseSchema,
    search: v.object({ feed: v.string() }),
  }),
});

app.get(routes["/__schema"], (c) => {
  return c.json(toJsonSchema(ApiJsonSchema));
});

export default app;
