/**
 * Banderas dibujadas en SVG y no con emoji.
 *
 * Windows no trae fuente para los emoji de bandera: el navegador acaba pintando
 * las dos letras del codigo de pais en su lugar, asi que 🇪🇸 se veria como "ES".
 * Dibujarlas garantiza el mismo resultado en todos los sistemas.
 *
 * Son versiones simplificadas —la de Espana sin el escudo, la de Estados Unidos
 * con menos estrellas— porque a 16 pixeles el detalle no se distingue y solo
 * anade peso.
 */
export default function Flag({
  country,
  className = "",
}: {
  country: "es" | "us";
  className?: string;
}) {
  const shared = `h-3 w-4 shrink-0 rounded-[2px] ${className}`.trim();

  if (country === "es") {
    return (
      <svg viewBox="0 0 12 8" aria-hidden="true" className={shared}>
        <rect width="12" height="8" fill="#AA151B" />
        <rect y="2" width="12" height="4" fill="#F1BF00" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 12 8" aria-hidden="true" className={shared}>
      <rect width="12" height="8" fill="#FFFFFF" />
      {[0, 2, 4, 6].map((y) => (
        <rect key={y} y={y} width="12" height="1" fill="#B31942" />
      ))}
      {[1, 3, 5, 7].map((y) => (
        <rect key={y} y={y} width="12" height="1" fill="#FFFFFF" />
      ))}
      <rect width="5" height="4" fill="#0A3161" />
      {[
        [1, 1],
        [3, 1],
        [2, 2],
        [1, 3],
        [3, 3],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.4" fill="#FFFFFF" />
      ))}
    </svg>
  );
}
