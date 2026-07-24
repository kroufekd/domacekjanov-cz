type BrandProps = {
  light?: boolean;
};

export function Brand({ light = false }: BrandProps) {
  return (
    <span className={`brand ${light ? "brand--light" : ""}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 42 42"
        className="brand__mark"
        fill="none"
      >
        <path d="M6 21.2 21 7l15 14.2v14.3H21.8" />
        <path d="M6 21.2v14.3h10.5" />
      </svg>
      <span className="brand__text">
        <span>Domeček</span>
        <strong>Janov</strong>
      </span>
    </span>
  );
}
