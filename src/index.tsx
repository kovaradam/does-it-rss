import { Hono } from "hono";
import { renderer } from "./renderer";
import { getChannelsFromUrl } from "./parse-feeds";
import { Page } from "./ui";
import {
  fetchChannel,
  getDocumentQuery,
  getIsRssChannel,
  timed,
  toUrl,
} from "./utils";
import {
  getFeedExtensions,
  getHash,
  parseFeedToJson,
} from "./parse-feed-to-json";
import { logger } from "hono/logger";

const app = new Hono();

app.use(renderer);
app.use(logger());
async function getChannelsFromUrlPublic(url: URL, signal: AbortSignal) {
  const result = await getChannelsFromUrl(url, signal)
    .then((channels) => channels.unwrapOr([]) ?? [])
    .then((channels) =>
      channels.map((channel) => ({
        url: channel.url,
        content: channel.content,
      })),
    );
  return result;
}

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
                  getChannelsFromUrlPublic(validUrl, c.req.raw.signal),
                () => [],
              ),
            }
          : null
      }
    />,
  );
});

app.get("/json", async (c) => {
  const urlParam = c.req.query("feed");

  const feeds = await toUrl(urlParam).match(
    (validUrl) => getChannelsFromUrlPublic(validUrl, c.req.raw.signal),
    () => [],
  );

  return c.json({ feeds });
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
      ? await getFeedExtensions(parsed.value)
      : undefined;

  return c.json(
    { feed: parsed.value, extensions },
    {
      headers: {
        "x-last-build-date": parsed.value.lastBuildDate ?? "",
        "x-feed-hash": await getHash(parsed.value),
      },
    },
  );
});

export default app;
