import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UpdateRequiredBanner from "./UpdateRequiredBanner";
import { isUpdateRequired } from "@/lib/api/client";
import { es } from "@/lib/i18n/messages";
import { setLocale } from "@/lib/i18n/locale";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();

  return {
    ...actual,
    isUpdateRequired: vi.fn(),
    subscribeToUpdateRequired: vi.fn(() => () => {}),
  };
});

describe("UpdateRequiredBanner", () => {
  it("shows the reload notice only when an update is required", () => {
    setLocale("es");

    vi.mocked(isUpdateRequired).mockReturnValue(false);
    const { unmount } = render(<UpdateRequiredBanner />);
    expect(screen.queryByRole("button", { name: es["update.reload"] })).not.toBeInTheDocument();
    unmount();

    vi.mocked(isUpdateRequired).mockReturnValue(true);
    render(<UpdateRequiredBanner />);
    expect(screen.getByText(es["update.title"])).toBeInTheDocument();
    expect(screen.getByRole("button", { name: es["update.reload"] })).toBeInTheDocument();
  });
});
