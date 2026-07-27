type BrandProps = {
  light?: boolean;
  /** Accessible name of the logo. The wordmark itself is language independent. */
  label?: string;
};

export function Brand({ light = false, label = "Domeček Janov" }: BrandProps) {
  return (
    <span className={`brand ${light ? "brand--light" : ""}`}>
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 90 64"
        className="brand__logo"
        fill="none"
      >
        <path
          className="brand__logo-roof"
          d="M6 26 14 20V12h6v3.5L30 8l24 18"
        />
        <text x="6" y="43" className="brand__logo-top">
          DOMEČEK
        </text>
        <text x="5" y="62" className="brand__logo-name">
          JANOV
        </text>
      </svg>
    </span>
  );
}
