import clsx from "clsx";
import { jsxRenderer } from "hono/jsx-renderer";
import { Link, ViteClient } from "vite-ssr-components/hono";
import { routes } from ".";

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html class={"h-full"}>
      <head>
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
        <title>Does it RSS?</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Find out what RSS feeds a website provides and parse them to JSON"
        />
      </head>
      <body class={clsx("h-svh")}>
        <header
          class={
            "flex items-center justify-end text-lg p-4 gap-4 [&_a]:hover:underline underline-offset-2"
          }
        >
          <a href={routes["/__openapi_ui"]} class={"font-bitcount-single"}>
            /api
          </a>
          <a href={"https://github.com/kovaradam/does-it-rss"}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-github-icon lucide-github w-4"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
        </header>
        {children}
        <div
          class={
            " bg-white opacity-25 w-[150vw] h-[150vw] fixed -z-10 rounded-full left-[30vw] top-[50svh]"
          }
        />
        <div
          class={
            "grain bg-emerald-500 top-0 w-[200vw] h-[200vw] block fixed -z-20 rounded-full -translate-x-1/2 "
          }
        />
      </body>
    </html>
  );
});
