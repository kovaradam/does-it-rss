import { expect, test } from "vitest";
import { parseFeedToJson } from "./parse-feed-to-json";
import { getDocumentQuery } from "./utils";

test("Correctly parses sample feed", () => {
  const result = parseFeedToJson(getDocumentQuery(SAMPLE_FEED));

  if (result.isErr()) {
    expect(false).toBe(true);
    return;
  }

  const parsed = result.value;

  expect(parsed.description).toBe(
    "Current headlines from the Dallas Times-Herald newspaper",
  );

  expect(parsed.link).toBe("https://dallas.example.com");
  expect(parsed.title).toBe("Dallas Times-Herald");
  expect(parsed.language).toBe("epo");
  expect(parsed.copyright).toBe("Copyright 2006 Dallas Times-Herald");
  expect(parsed.managingEditor).toBe("jlehrer@dallas.example.com (Jim Lehrer)");
  expect(parsed.webMaster).toBe("bob.brock@dallas.example.com (Bob Brock)");
  expect(parsed.pubDate).toBe("Sun, 29 Jan 2006 05:00:00 GMT");
  expect(parsed.lastBuildDate).toBe("Sun, 29 Jan 2006 17:17:44 GMT");
  expect(parsed.categories?.[0]?.value).toBe("Media");
  expect(parsed.categories?.[1]?.domain).toBe(
    "Newspapers/Regional/United_States",
  );
  expect(parsed.generator).toBe("Radio UserLand v8.2.1");
  expect(parsed.docs).toBe("https://www.rssboard.org/rss-specification");
  expect(parsed.cloud).toMatchObject({
    domain: "server.example.com",
    path: "/rpc",
    port: "80",
    protocol: "xml-rpc",
    registerProcedure: "cloud.notify",
  });
  expect(parsed.ttl).toBe("60");
  expect(parsed.image).toMatchObject({
    link: "https://dallas.example.com",
    title: "Dallas Times-Herald",
    url: "https://dallas.example.com/masthead.gif",
    description: "Read the Dallas Times-Herald",
    height: "32",
    width: "96",
  });
  expect(parsed.rating).toBe(
    '(PICS-1.1 "https://www.rsac.org/ratingsv01.html" l by "webmaster@example.com" on "2006.01.29T10:09-0800" r (n 0 s 0 v 0 l 0))',
  );
  expect(parsed.skipHours).toMatchObject(["0", "1", "2", "22", "23"]);
  expect(parsed.skipDays).toMatchObject(["Saturday", "Sunday"]);
  expect(parsed.textInput).toMatchObject({
    description:
      "Your aggregator supports the textInput element. What software are you using?",
    link: "https://workbench.cadenhead.org/textinput.php",
    name: "query",
    title: "TextInput Inquiry",
  });

  expect(parsed.items?.length).toBe(4);
  expect(parsed.items?.[0]?.categories?.[0]?.value).toBe(undefined);
  expect(parsed.items?.[0]?.title).toBe(
    "Seventh Heaven! Ryan Hurls Another No Hitter",
  );
  expect(parsed.items?.[0]?.link).toBe(
    "https://dallas.example.com/1991/05/02/nolan.htm",
  );
  expect(parsed.items?.[0]?.description).toBe(
    "Texas Rangers pitcher Nolan Ryan hurled the seventh no-hitter of his legendary career on Arlington Appreciation Night, defeating the Toronto Blue Jays 3-0. The 44-year-old struck out 16 batters before a crowd of 33,439.",
  );
  expect(parsed.items?.[0]?.guid?.value).toBe(
    "https://dallas.example.com/1991/05/02/nolan.htm",
  );
  expect(parsed.items?.[0]?.guid?.isPermaLink).toBe(undefined);
  expect(parsed.items?.[0]?.["extensions:imageUrl"]).toBe("https://item.img");
  expect(parsed.items?.[0]?.["dc:creator"]).toBe(
    "bob.brock@dallas.example.com",
  );

  expect(parsed.items?.[1]?.title).toBe("Joe Bob Goes to the Drive-In");
  expect(parsed.items?.[1]?.author).toBe(
    "jbb@dallas.example.com (Joe Bob Briggs)",
  );
  expect(parsed.items?.[1]?.categories?.[0]?.value).toBe(
    "rec.arts.movies.reviews",
  );
  expect(parsed.items?.[1]?.comments).toBe(
    "https://dallas.example.com/feedback/1983/06/joebob.htm",
  );
  expect(parsed.items?.[1]?.description).toBe(
    "I'm headed for France. I wasn't gonna go this year, but then last week \"Valley Girl\" came out and I said to myself, Joe Bob, you gotta get out of the country for a while.",
  );
  expect(parsed.items?.[1]?.enclosure).toMatchObject({
    length: "24986239",
    type: "audio/mpeg",
    url: "https://dallas.example.com/joebob_050689.mp3",
  });
  expect(parsed.items?.[1]?.guid).toMatchObject({
    value: "https://dallas.example.com/1983/05/06/joebob.htm",
    isPermaLink: undefined,
  });
  expect(parsed.items?.[1]?.link).toBe(
    "https://dallas.example.com/1983/05/06/joebob.htm",
  );
  expect(parsed.items?.[1]?.pubDate).toBe("Fri, 06 May 1983 09:00:00 CST");
  expect(parsed.items?.[1]?.source?.value).toBe("Los Angeles Herald-Examiner");
  expect(parsed.items?.[1]?.source?.url).toBe("https://la.example.com/rss.xml");

  expect(parsed.items?.[2]?.guid?.value).toBe(
    "tag:dallas.example.com,4131:news",
  );
  expect(parsed.items?.[2]?.guid?.isPermaLink).toBe("false");
  expect(parsed.items?.[2]?.description).toBe(
    "I'm headed for France. I wasn't gonna go this year, but then last week &lt;a href=\"https://www.imdb.com/title/tt0086525/\"&gt;Valley Girl&lt;/a&gt; came out and I said to myself, Joe Bob, you gotta get out of the country for a while.",
  );
  expect(parsed.items?.[2]?.["extensions:imageUrl"]).toBe(
    "https://media.content.img",
  );

  expect(parsed.items?.[3]?.guid?.value).toBe("1983-05-06+lifestyle+joebob+2");
  expect(parsed.items?.[3]?.guid?.isPermaLink).toBe("false");
  expect(parsed.items?.[3]?.description).toBe(
    "<![CDATA[I'm headed for France. I wasn't gonna go this year, but then last week <a href=\"https://www.imdb.com/title/tt0086525/\">Valley Girl</a> came out and I said to myself, Joe Bob, you gotta get out of the country for a while.]]>",
  );
  expect(parsed.items?.[3]?.["extensions:imageUrl"]).toBe(
    "https://content.encoded.img",
  );
});

/**
 * https://www.rssboard.org/files/rss-2.0-sample.xml
 */
const SAMPLE_FEED = `
  <rss version="2.0">
    <channel>
      <description>Current headlines from the Dallas Times-Herald newspaper</description>
      <link>https://dallas.example.com</link>
      <title>Dallas Times-Herald</title>
      <category>Media</category>
      <category domain="Newspapers/Regional/United_States">Texas</category>
      <cloud domain="server.example.com" path="/rpc" port="80" protocol="xml-rpc" registerProcedure="cloud.notify" />
      <copyright>Copyright 2006 Dallas Times-Herald</copyright>
      <docs>https://www.rssboard.org/rss-specification</docs>
      <generator>Radio UserLand v8.2.1</generator>
      <image>
        <link>https://dallas.example.com</link>
        <title>Dallas Times-Herald</title>
        <url>https://dallas.example.com/masthead.gif</url>
        <description>Read the Dallas Times-Herald</description>
        <height>32</height>
        <width>96</width>
      </image>
      <language>epo</language>
      <lastBuildDate>Sun, 29 Jan 2006 17:17:44 GMT</lastBuildDate>
      <managingEditor>jlehrer@dallas.example.com (Jim Lehrer)</managingEditor>
      <pubDate>Sun, 29 Jan 2006 05:00:00 GMT</pubDate>
      <rating>(PICS-1.1 "https://www.rsac.org/ratingsv01.html" l by "webmaster@example.com" on "2006.01.29T10:09-0800" r (n 0 s 0 v 0 l 0))</rating>
      <skipDays>
        <day>Saturday</day>
        <day>Sunday</day>
      </skipDays>
      <skipHours>
        <hour>0</hour>
        <hour>1</hour>
        <hour>2</hour>
        <hour>22</hour>
        <hour>23</hour>
      </skipHours>
      <textInput>
        <description>Your aggregator supports the textInput element. What software are you using?</description>
        <link>https://workbench.cadenhead.org/textinput.php</link>
        <name>query</name>
        <title>TextInput Inquiry</title>
      </textInput>
      <ttl>60</ttl>
      <webMaster>bob.brock@dallas.example.com (Bob Brock)</webMaster>
      <item>
        <title>Seventh Heaven! Ryan Hurls Another No Hitter</title>
        <link>https://dallas.example.com/1991/05/02/nolan.htm</link>
        <description>Texas Rangers pitcher Nolan Ryan hurled the seventh no-hitter of his legendary career on Arlington Appreciation Night, defeating the Toronto Blue Jays 3-0. The 44-year-old struck out 16 batters before a crowd of 33,439.</description>
        <guid>https://dallas.example.com/1991/05/02/nolan.htm</guid>
        <enclosure url="https://item.img" type="image/jpeg"/>
        <dc:creator>bob.brock@dallas.example.com</dc:creator>
      </item>
      <item>
        <author>jbb@dallas.example.com (Joe Bob Briggs)</author>
        <category>rec.arts.movies.reviews</category>
        <comments>https://dallas.example.com/feedback/1983/06/joebob.htm</comments>
        <description>I'm headed for France. I wasn't gonna go this year, but then last week "Valley Girl" came out and I said to myself, Joe Bob, you gotta get out of the country for a while.</description>
        <enclosure length="24986239" type="audio/mpeg" url="https://dallas.example.com/joebob_050689.mp3" />
        <guid>https://dallas.example.com/1983/05/06/joebob.htm</guid>
        <link>https://dallas.example.com/1983/05/06/joebob.htm</link>
        <pubDate>Fri, 06 May 1983 09:00:00 CST</pubDate>
        <source url="https://la.example.com/rss.xml">Los Angeles Herald-Examiner</source>
        <title>Joe Bob Goes to the Drive-In</title>
      </item>
      <item>
        <description>I'm headed for France. I wasn't gonna go this year, but then last week &lt;a href="https://www.imdb.com/title/tt0086525/"&gt;Valley Girl&lt;/a&gt; came out and I said to myself, Joe Bob, you gotta get out of the country for a while.</description>
        <guid isPermaLink="false">tag:dallas.example.com,4131:news</guid>
        <media:content url="https://media.content.img" medium="image"/>

      </item>
      <item>
        <description><![CDATA[I'm headed for France. I wasn't gonna go this year, but then last week <a href="https://www.imdb.com/title/tt0086525/">Valley Girl</a> came out and I said to myself, Joe Bob, you gotta get out of the country for a while.]]></description>
        <guid isPermaLink="false">1983-05-06+lifestyle+joebob+2</guid>
        <content:encoded><![CDATA[<img src='https://content.encoded.img'/>]]></content:encoded>
      </item>
    </channel>
  </rss>
  `;

test("handles namespaced content", () => {
  const result = parseFeedToJson(getDocumentQuery(FEED_NAMESPACES));

  if (result.isErr()) {
    expect(false).toBe(true);
    return;
  }

  const parsed = result.value;

  expect(parsed["content:encoded"]).toBe("Encoded content");
  expect(parsed["atom:link"]).toMatchObject({
    href: "http://dallas.example.com/rss.xml",
    length: "xyz",
    hreflang: "en",
    title: "RSS",
    type: "application/rss+xml",
    rel: "self",
  });
  expect(parsed["creativeCommons:license"]).toBe(
    "https://www.creativecommons.org/licenses/by-nd/1.0",
  );

  expect(parsed.items?.[0]?.["creativeCommons:license"]).toBe(
    "https://www.creativecommons.org/licenses/by-nd/1.0",
  );
  expect(parsed.items?.[0]?.["trackback:about"]).toBe(
    "https://www.imdb.com/title/tt0086525",
  );
  expect(parsed.items?.[0]?.["trackback:ping"]).toBe(
    "https://dallas.example.com/trackback/tb.php?id=1983/06/joebob2.htm",
  );

  expect(parsed.items?.[1]?.["trackback:about"]).toBe(
    "http://ekzemplo.com/tb.cgi?tb_id=180",
  );
  expect(parsed.items?.[1]?.["trackback:ping"]).toBe(
    "http://ekzemplo.com/tb.cgi?tb_id=180",
  );
});

const FEED_NAMESPACES = `
  <rss>
    <channel>
      <content:encoded>Encoded content</content:encoded>
      <atom:link href="http://dallas.example.com/rss.xml" title="RSS" length="xyz" hreflang="en" rel="self" type="application/rss+xml" />
      <creativeCommons:license>https://www.creativecommons.org/licenses/by-nd/1.0</creativeCommons:license>
      <item>
        <creativeCommons:license>https://www.creativecommons.org/licenses/by-nd/1.0</creativeCommons:license>
        <trackback:ping>https://dallas.example.com/trackback/tb.php?id=1983/06/joebob2.htm</trackback:ping>
        <trackback:about>https://www.imdb.com/title/tt0086525</trackback:about>
      </item>
      <item>
        <trackback:about rdf:resource="http://ekzemplo.com/tb.cgi?tb_id=180"/>
        <trackback:ping rdf:resource="http://ekzemplo.com/tb.cgi?tb_id=180"/>
      </item>
    </channel>
  </rss>
  `;
