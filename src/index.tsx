import { Hono } from "hono";
import { renderer } from "./renderer";
import { getChannelsFromUrl } from "./parse-feeds";

const app = new Hono();

app.use(renderer);

app.get("/", async (c) => {
  const urlParam = c.req.query("feed");
  let result = null;
  if (urlParam) {
    result = await getChannelsFromUrl(new URL(urlParam), c.req.raw.signal);
  }
  return c.render(
    <body>
      <form>
        <input name="feed" type="url" />
        <button type="submit" name="client" value="ui">
          find
        </button>
      </form>
      {urlParam && (
        <result>
          {result ? (
            <ul>
              {result.map((item) => (
                <li>
                  <dl>
                    <dt>link</dt>
                    <dd>{item.url.href}</dd>
                  </dl>
                  <dl>
                    <dt>title</dt>
                    <dd>{item.content.title}</dd>
                  </dl>
                  <dl>
                    <dt>description</dt>
                    <dd>{item.content.description}</dd>
                  </dl>
                </li>
              ))}
            </ul>
          ) : (
            "not found"
          )}
        </result>
      )}
    </body>,
  );
});

export default app;
