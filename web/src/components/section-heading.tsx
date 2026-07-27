/**
 * Headings are plain strings so they can be translated and edited in Sanity.
 * A single `|` marks the hard line break: what follows moves to its own line
 * and is set in italics, which is the accent the design relies on.
 */
export function splitHeading(title: string): [string, string | undefined] {
  const separator = title.indexOf("|");
  if (separator === -1) return [title.trim(), undefined];
  return [
    title.slice(0, separator).trim(),
    title.slice(separator + 1).trim() || undefined,
  ];
}

export function HeadingText({ title }: { title: string }) {
  const [lead, accent] = splitHeading(title);
  if (!accent) return <>{lead}</>;

  return (
    <>
      {lead}{" "}
      <br className="heading-break" />
      <em>{accent}</em>
    </>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
}: SectionHeadingProps) {
  return (
    <div
      className={`section-heading section-heading--${align} ${
        light ? "section-heading--light" : ""
      }`}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2>
        <HeadingText title={title} />
      </h2>
      {description ? (
        <p className="section-heading__description">{description}</p>
      ) : null}
    </div>
  );
}
