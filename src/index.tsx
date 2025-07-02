import { Hono } from "hono";
import { renderer } from "./renderer";
import { getChannelsFromUrl } from "./parse-feeds";
import { Page } from "./ui";
import { toUrl } from "./utils";

const app = new Hono();

app.use(renderer);

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
  const urlParam = c.req.query("feed");

  const feeds = urlParam
    ? await getChannelsFromUrl(new URL(urlParam), c.req.raw.signal)
    : [];

  return c.json({ feeds });
});

export default app;
