import clsx from "clsx";
import { RssFeedListResponseSchemaType } from "./parse-feeds";
import { jsx, JSX } from "hono/jsx";
import { HtmlEscapedString } from "hono/utils/html";
import { toUrl } from "./utils";
import { Context } from "hono";

export async function Page(props: {
  result: {
    urlParam: string;
    feeds: RssFeedListResponseSchemaType["feeds"];
  } | null;
  context: Context;
}) {
  const resultUrl = toUrl(props.result?.urlParam)?.match(
    (url) => url,
    () => null,
  );

  const heading = (
    <h1
      class={"wrap-normal tracking-wide"}
      style={{ "view-transition-name": "header" }}
    >
      <span>Does it</span>{" "}
      <span class={"text-nowrap"}>
        <span class={"font-bitcount font-light"}>RSS</span>?
      </span>
    </h1>
  );

  const feedCount = props.result?.feeds?.length;

  return (
    <main class={"flex items-center flex-col px-4"}>
      {props.result?.urlParam ? (
        <div class={"mt-[10svh]"}>
          <a
            type="submit"
            value="ui"
            class={
              "items-center block border-b active:scale-97 w-fit mb-8 text-muted-foreground hover:border-transparent"
            }
            href="/?autofocus=feed"
          >
            <ArrowRight class="w-4 h-4 -scale-x-100 -translate-y-0.5 inline mr-0.5" />
            Go to search
          </a>
          <div class={"text-5xl"}>{heading}</div>
          <h2 class={"text-muted-foreground"}>
            {feedCount === 0
              ? "No feeds were"
              : feedCount === 1
                ? "1 feed was"
                : `${feedCount} feeds were`}{" "}
            found on{" "}
            <a
              href={resultUrl?.href}
              style={{ "view-transition-name": "hostname" }}
              class={"break-all underline hover:no-underline"}
            >
              {resultUrl?.hostname ?? props.result?.urlParam ?? "it"}
            </a>
          </h2>

          <div class={"mt-8 flex flex-col"}>
            <div class="mb-8" style={{ "view-transition-name": "live-area" }}>
              <>
                <ul class={"divide-y divide-slate-300 dark:divide-slate-700"}>
                  {props.result.feeds.map((item) => (
                    <li class="py-4 mb-4 w-[80ch] max-w-[90vw] relative">
                      <dl>
                        <dt class={"hidden"}>title</dt>
                        <dd class={"sm font-bold sm:max-w-2/3"}>
                          {item.content.title}
                        </dd>

                        <dt class={"hidden"}>link</dt>
                        <div
                          class={
                            "text-muted-foreground flex flex-wrap gap-x-1 sm:max-w-2/3 mb-1"
                          }
                        >
                          <dt class={"hidden"}>json feed</dt>
                          <dd>
                            <a
                              class={
                                "underline hover:no-underline underline-offset-1 wrap-break-word"
                              }
                              href={`${item.parseLink}?pretty`}
                            >
                              JSON feed
                            </a>
                            ,
                          </dd>

                          <dd>
                            <a
                              class={
                                "underline hover:no-underline underline-offset-1 wrap-break-word"
                              }
                              href={item.url}
                            >
                              {item.url} <ArrowTopRight class="w-4 inline" />
                            </a>
                          </dd>
                        </div>

                        <dt class={"hidden"}>description</dt>
                        <dd>
                          {item.content.description || "Description not found"}
                        </dd>
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div class={"mt-[15svh] mb-16 text-7xl md:text-9xl font-thin"}>
            {heading}
          </div>
          <form
            class={
              "flex flex-col items-center w-screen sm:w-[60ch] max-w-[90vw] max-sm:rounded-t-4xl"
            }
            style={{ "view-transition-name": "live-area" }}
          >
            <div class={"flex flex-col gap-2 w-full "}>
              <div>
                <label htmlFor="feed" class={""}>
                  Web page address
                </label>
              </div>

              <input
                class={
                  "border border-current/80 dark:border-current/60 rounded px-2 py-2 "
                }
                name="feed"
                id="feed"
                value={props.result?.urlParam}
                placeholder="https://www.nasa.gov"
                autofocus={props.context.req.query("autofocus") === "feed"}
                required
              />
              <p class={"text-muted-foreground -mt-1"}>
                Scan this page if it provides any RSS feeds
              </p>
            </div>

            <div class={"py-3"}></div>
            <SubmitButton type="submit">Scan the page</SubmitButton>
          </form>
        </>
      )}
    </main>
  );
}

function SubmitButton(
  props: JSX.HTMLAttributes & { direction?: "left" | "right"; href?: string },
) {
  const direction = props.direction ?? "right";

  return jsx(
    props.href ? "a" : "button",
    {
      ...props,
      class: clsx(
        "group hover:border-current bg-primary dark:bg-accent p-2 px-4 rounded text-background text-xl m-2 flex items-center-safe font-bitcount-single active:scale-97",
        props.class,
      ),
    },
    (
      <>
        {direction === "left" && (
          <ArrowRight class="w-6 -mr-4 scale-0 rotate-y-180 group-hover:mr-1 group-hover:scale-100  transition-all" />
        )}
        <span class={"pt-1"}>{props.children}</span>
        {direction === "right" && (
          <ArrowRight class="w-6 -ml-5 scale-0 group-hover:ml-0 group-hover:scale-100 transition-all" />
        )}
      </>
    ) as string,
  ) as unknown as HtmlEscapedString;
}

function ArrowRight(props: JSX.HTMLAttributes) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-dasharray="1 2"
      {...props}
      class={clsx(props.class, "lucide")}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowTopRight(props: JSX.HTMLAttributes) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
      class={clsx(
        props.class,
        "lucide lucide-arrow-up-right-icon lucide-arrow-up-right",
      )}
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}
