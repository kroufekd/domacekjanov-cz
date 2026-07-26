import { ArrowUpRight, CalendarDays } from "lucide-react";

type AvailabilityProps = {
  listingUrl: string;
};

export function Availability({ listingUrl }: AvailabilityProps) {
  return (
    <a
      className="button button--primary"
      href={listingUrl}
      target="_blank"
      rel="noreferrer"
    >
      <CalendarDays aria-hidden="true" size={18} />
      Zkontrolovat obsazenost
      <ArrowUpRight aria-hidden="true" size={17} />
    </a>
  );
}
