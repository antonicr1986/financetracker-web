import { vi } from "vitest";

/**
 * Piezas comunes de los tests de las pantallas de acceso. Las paginas se
 * pintan enteras; solo se sustituyen la navegacion de Next y el boton de
 * Google (carga un script externo que en jsdom no existe).
 */
export const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

vi.mock("@/components/GoogleSignInButton", () => ({
  default: () => null,
}));
