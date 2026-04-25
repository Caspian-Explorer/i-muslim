import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          i-muslim — read the Quran and Sunnah. Quran text &amp; translations by{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://quran.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            quran.com
          </a>
          ; hadith by{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://github.com/fawazahmed0/hadith-api"
            target="_blank"
            rel="noopener noreferrer"
          >
            fawazahmed0/hadith-api
          </a>
          .
        </p>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="hover:text-foreground" href="/articles">
            Articles
          </Link>
          <a
            className="hover:text-foreground"
            href="/articles/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
          >
            RSS
          </a>
        </nav>
      </div>
    </footer>
  );
}
