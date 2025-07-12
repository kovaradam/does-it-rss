import { Hono } from "hono";
import { renderer } from "./renderer";
import {
  RssFeedListResponseSchema,
  RssFeedListResponseSchemaType,
  getChannelsFromUrlPublic,
} from "./parse-feeds";
import { Page } from "./ui";
import {
  fetchChannel,
  getDocumentQuery,
  getIsRssChannel,
  toUrl,
} from "./utils";
import {
  getFeedExtensions,
  getHash,
  parseFeedToJson,
  RssFeedSchema,
} from "./parse-feed-to-json";
import { logger } from "hono/logger";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";

const app = new Hono();

app.use(renderer);
app.use(logger());

app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

app.get("/", async (c) => {
  const urlParam = c.req.query("feed");

  const feedUrl = toUrl(urlParam);

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
    />,
  );
});

app.get("/json", async (c) => {
  const urlParam = toUrl(c.req.query("feed"));

  if (urlParam.isErr()) {
    return c.json({ error: "invalid url format" }, { status: 400 });
  }

  return c.json<RssFeedListResponseSchemaType>(
    await getChannelsFromUrlPublic(urlParam.value, c.req.raw.signal),
  );
});

app.get("/json-feed", async (c) => {
  const feedUrl = toUrl(c.req.query("feed"));
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
    c.req.query("extensions") !== "false"
      ? await getFeedExtensions(parsed.value, feedUrl.value, c.req.raw.signal)
      : undefined;
  if (extensions) {
    parsed.value.extensions = { imageUrl: extensions?.channelImage };
  }

  return c.json<RssFeedResponseSchemaType>(
    { feed: parsed.value },
    {
      headers: {
        "x-last-build-date": parsed.value.lastBuildDate ?? "",
        "x-feed-hash": await getHash(parsed.value),
      },
    },
  );
});

const RssFeedResponseSchema = v.object({
  feed: RssFeedSchema,
});

type RssFeedResponseSchemaType = v.InferOutput<typeof RssFeedResponseSchema>;

const ApiSchema = v.object({
  ["/json"]: v.object({
    response: RssFeedListResponseSchema,
    search: v.object({ feed: v.string() }),
  }),
  ["/json-feed"]: v.object({
    response: RssFeedResponseSchema,
    search: v.object({ feed: v.string() }),
  }),
});

app.get("__schema", (c) => {
  return c.json(toJsonSchema(ApiSchema));
});

export default app;
