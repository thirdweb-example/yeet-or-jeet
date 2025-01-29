import Link from "next/link";
import { Badge } from "../ui/badge";

export function SourcesSection() {
  const sources = [
    {
      label: "thirdweb Nebula",
      href: "https://thirdweb.com/nebula",
    },
    {
      label: "Perplexity",
      href: "https://www.perplexity.ai",
    },
    {
      label: "Cielo",
      href: "https://cielo.finance",
    },
  ];

  return (
    <section>
      <h3 className="text-lg font-semibold tracking-tight mb-3">Sources</h3>
      <div className="flex items-center gap-3">
        {sources.map((source) => {
          return (
            <Link key={source.label} href={source.href} target="_blank">
              <Badge
                variant="secondary"
                className="px-2 py-1 hover:bg-inverted hover:text-inverted-foreground"
              >
                {source.label}
              </Badge>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
