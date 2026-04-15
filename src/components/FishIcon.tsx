// Ícone SVG de peixe simples
export function FishIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Corpo do peixe */}
      <path
        d="M10 32 C10 20 20 12 36 12 C48 12 56 20 56 32 C56 44 48 52 36 52 C20 52 10 44 10 32Z"
        fill="#FF6B1A"
      />
      {/* Cauda */}
      <path
        d="M10 32 L2 20 L2 44 Z"
        fill="#FF6B1A"
      />
      {/* Olho */}
      <circle cx="44" cy="27" r="3" fill="white" />
      <circle cx="44" cy="27" r="1.5" fill="#0A2342" />
      {/* Escamas */}
      <path
        d="M28 22 C28 22 34 26 34 32 C34 38 28 42 28 42"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M20 25 C20 25 26 29 26 35 C26 39 22 41 22 41"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  )
}
