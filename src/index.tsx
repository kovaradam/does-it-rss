import { Hono } from "hono";
import { renderer } from "./renderer";
import { getChannelsFromUrl } from "./parse-feeds";
import { Page } from "./ui";

const app = new Hono();

app.use(renderer);

app.get("/", async (c) => {
  const urlParam = c.req.query("feed");

  return c.render(
    <Page
      result={
        urlParam
          ? {
              urlParam,
              feeds:
                (
                  await getChannelsFromUrl(new URL(urlParam), c.req.raw.signal)
                ).unwrapOr([]) ?? [],
            }
          : null
      }
    />,
  );
});

app.get("/json", async (c) => {
  const urlParam = c.req.query("feed");

  const feeds = urlParam
    ? await getChannelsFromUrl(new URL(urlParam), c.req.raw.signal)
    : [];

  return c.json({ feeds });
});

app.get("/parse", async (c) => {
  const urlParam = c.req.query("feed");

  const feeds = urlParam
    ? await getChannelsFromUrl(new URL(urlParam), c.req.raw.signal)
    : [];

  return c.json({ feeds });
});

export default app;
