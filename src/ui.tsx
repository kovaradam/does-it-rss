import { RssFeedListResponseSchemaType } from "./parse-feeds";

export async function Page(props: {
  result: {
    urlParam: string;
    feeds: RssFeedListResponseSchemaType["feeds"];
  } | null;
}) {
  return (
    <body>
      <form>
        <input name="feed" type="url" value={props.result?.urlParam} />
        <button type="submit" name="client" value="ui">
          find
        </button>
      </form>
      {props.result?.urlParam && (
        <result>
          {!!props.result?.feeds?.length ? (
            <ul>
              {props.result.feeds.map((item) => (
                <li>
                  <dl>
                    <dt>link</dt>
                    <dd>{item.url}</dd>
                    <dd>
                      <a href={`/json-feed?feed=${item.url}`}>json</a>
                    </dd>
                    <dt>title</dt>
                    <dd>{item.content.title}</dd>
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
    </body>
  );
}
