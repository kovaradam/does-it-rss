import { fetchChannel, getDocumentQuery, getIsRssChannel } from "./utils";

export async function parseFeedToJson(url: URL, signal: AbortSignal) {
  const feedXml = await fetchChannel(url, signal);

  if (feedXml.isErr()) {
    return null;
  }

  const query = getDocumentQuery(feedXml.value);
  if (!getIsRssChannel(query)) {
    return null;
  }
  return {};
}
