import { ChannelsResponse } from "./parse-feeds";

export async function Page(props: {
  result: {
    urlParam: string;
    feeds: ChannelsResponse;
  } | null;
}) {
  return (
    <body>
      <form>
        <input name="feed" type="url" />
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
    </body>
  );
}
