import { ArrowUpRight, CalendarDays } from "lucide-react";

type AvailabilityProps = {
  listingUrl: string;
  label: string;
};

export function Availability({ listingUrl, label }: AvailabilityProps) {
  return (
    <a
      className="button button--primary"
      href={listingUrl}
      target="_blank"
      rel="noreferrer"
    >
      <CalendarDays aria-hidden="true" size={18} />
      {label}
      <ArrowUpRight aria-hidden="true" size={17} />
    </a>
  );
}
