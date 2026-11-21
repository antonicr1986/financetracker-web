import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { router } from "@/test/pageMocks";
import RegisterPage from "./page";
import { ApiError, getToken, login, register, verifyEmail } from "@/lib/api/client";
import { es } from "@/lib/i18n/messages";
import { setLocale } from "@/lib/i18n/locale";
import type { LoginResponseDto } from "@/lib/types";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return { ...actual, register: vi.fn(), login: vi.fn(), verifyEmail: vi.fn() };
});

const session: LoginResponseDto = {
  token: "jwt-new",
  expiration: "2026-12-01T00:00:00Z",
  user: { id: 9, name: "Ana", email: "ana@test.com" },
};

const emailChallenge = {
  emailVerificationRequired: true as const,
  verificationToken: "verify-token",
  email: "ana@test.com",
  expiration: "",
};

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  values: { password?: string; confirmation?: string } = {},
) {
  const password = values.password ?? "una-clave-larga";
  const confirmation = values.confirmation ?? password;
  await user.type(screen.getByLabelText(es["register.name"]), " Ana ");
  await user.type(screen.getByLabelText(es["login.email"]), "ana@test.com");
  await user.type(screen.getByLabelText(es["login.password"]), password);
  await user.type(screen.getByLabelText(es["register.confirm"]), confirmation);
  await user.click(screen.getByRole("button", { name: es["register.title"] }));
}

function renderPage() {
  render(<RegisterPage />);
  return userEvent.setup();
}

beforeEach(() => {
  setLocale("es");
  router.push.mockReset();
  vi.mocked(register).mockReset();
  vi.mocked(login).mockReset();
  vi.mocked(verifyEmail).mockReset();
});

describe("RegisterPage", () => {
  it("asks for every field", async () => {
    const user = renderPage();

    await user.click(screen.getByRole("button", { name: es["register.title"] }));

    expect(await screen.findByRole("alert")).toHaveTextContent(es["errors.fillAll"]);
    expect(register).not.toHaveBeenCalled();
  });

  it("rejects a short password before calling the API", async () => {
    const user = renderPage();

    await fill(user, { password: "corta" });

    expect(await screen.findByRole("alert")).toHaveTextContent(es["errors.passwordTooShort"]);
    expect(register).not.toHaveBeenCalled();
  });

  it("rejects two different passwords", async () => {
    const user = renderPage();

    await fill(user, { confirmation: "otra-clave-larga" });

    expect(await screen.findByRole("alert")).toHaveTextContent(es["errors.passwordsDontMatch"]);
    expect(register).not.toHaveBeenCalled();
  });

  it("creates the account, signs in and goes to the dashboard", async () => {
    vi.mocked(register).mockResolvedValue({ id: 9, name: "Ana", email: "ana@test.com" });
    vi.mocked(login).mockResolvedValue(session);
    const user = renderPage();

    await fill(user);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(register).toHaveBeenCalledWith("Ana", "ana@test.com", "una-clave-larga", "es");
    expect(getToken()).toBe("jwt-new");
  });

  it("shows the API error when the email is already taken", async () => {
    vi.mocked(register).mockRejectedValue(new ApiError("invalid_request", 400, "email_already_exists"));
    const user = renderPage();

    await fill(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(es["apiError.email_already_exists"]);
    expect(login).not.toHaveBeenCalled();
  });

  it("asks for the email code and then enters", async () => {
    vi.mocked(register).mockResolvedValue({ id: 9, name: "Ana", email: "ana@test.com" });
    vi.mocked(login).mockResolvedValue(emailChallenge);
    vi.mocked(verifyEmail).mockResolvedValue(session);
    const user = renderPage();

    await fill(user);
    await user.type(await screen.findByLabelText(es["emailVerification.code"]), "123456");
    await user.click(screen.getByRole("button", { name: es["mfa.verify"] }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(verifyEmail).toHaveBeenCalledWith("verify-token", "123456");
  });

  it("sends to the sign-in page when the email step has expired", async () => {
    vi.mocked(register).mockResolvedValue({ id: 9, name: "Ana", email: "ana@test.com" });
    vi.mocked(login).mockResolvedValue(emailChallenge);
    vi.mocked(verifyEmail).mockRejectedValue(new ApiError("invalid_request", 401, "invalid_verification_token"));
    const user = renderPage();

    await fill(user);
    await user.type(await screen.findByLabelText(es["emailVerification.code"]), "123456");
    await user.click(screen.getByRole("button", { name: es["mfa.verify"] }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/login"));
  });
});
