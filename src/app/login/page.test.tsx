import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { router } from "@/test/pageMocks";
import LoginPage from "./page";
import { ApiError, getToken, isUsingMockData, login, verifyEmail, verifyMfa } from "@/lib/api/client";
import { es } from "@/lib/i18n/messages";
import { setLocale } from "@/lib/i18n/locale";
import type { LoginResponseDto } from "@/lib/types";

// Solo se sustituyen las llamadas a la API: ApiError, setToken y el resto
// siguen siendo los reales.
vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return {
    ...actual,
    isUsingMockData: vi.fn(() => false),
    warmUpApi: vi.fn(),
    login: vi.fn(),
    googleLogin: vi.fn(),
    verifyMfa: vi.fn(),
    verifyEmail: vi.fn(),
  };
});

const session: LoginResponseDto = {
  token: "jwt-123",
  expiration: "2026-12-01T00:00:00Z",
  user: { id: 7, name: "Ana", email: "ana@test.com" },
};

function renderPage() {
  render(<LoginPage />);
  return userEvent.setup();
}

async function signIn(user: ReturnType<typeof userEvent.setup>, email = "ana@test.com", password = "una-clave-larga") {
  await user.type(screen.getByLabelText(es["login.email"]), email);
  await user.type(screen.getByLabelText(es["login.password"]), password);
  await user.click(screen.getByRole("button", { name: es["login.submit"] }));
}

beforeEach(() => {
  setLocale("es");
  router.push.mockReset();
  vi.mocked(isUsingMockData).mockReturnValue(false);
  vi.mocked(login).mockReset();
  vi.mocked(verifyMfa).mockReset();
  vi.mocked(verifyEmail).mockReset();
});

describe("LoginPage", () => {
  it("asks for both fields before calling the API", async () => {
    const user = renderPage();

    await user.click(screen.getByRole("button", { name: es["login.submit"] }));

    expect(await screen.findByRole("alert")).toHaveTextContent(es["errors.fillCredentials"]);
    expect(login).not.toHaveBeenCalled();
  });

  it("shows the API error for wrong credentials and stays on the form", async () => {
    vi.mocked(login).mockRejectedValue(new ApiError("invalid_request", 401, "invalid_credentials"));
    const user = renderPage();

    await signIn(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(es["apiError.invalid_credentials"]);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("saves the session and goes to the dashboard", async () => {
    vi.mocked(login).mockResolvedValue(session);
    const user = renderPage();

    await signIn(user);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(login).toHaveBeenCalledWith("ana@test.com", "una-clave-larga");
    expect(getToken()).toBe("jwt-123");
  });

  it("signs in with the demo account in one click", async () => {
    vi.mocked(login).mockResolvedValue(session);
    const user = renderPage();

    await user.click(screen.getByRole("button", { name: es["login.demo"] }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("demo@financetracker.app", expect.any(String)));
  });

  it("asks for the MFA code and then enters", async () => {
    vi.mocked(login).mockResolvedValue({ mfaRequired: true, mfaToken: "mfa-token", expiration: "" });
    vi.mocked(verifyMfa).mockResolvedValue(session);
    const user = renderPage();

    await signIn(user);
    await user.type(await screen.findByLabelText(es["mfa.loginCode"]), "123456");
    await user.click(screen.getByRole("button", { name: es["mfa.verify"] }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(verifyMfa).toHaveBeenCalledWith("mfa-token", "123456", false);
  });

  it("goes back to the password when the MFA step has expired", async () => {
    vi.mocked(login).mockResolvedValue({ mfaRequired: true, mfaToken: "mfa-token", expiration: "" });
    vi.mocked(verifyMfa).mockRejectedValue(new ApiError("invalid_request", 401, "invalid_mfa_token"));
    const user = renderPage();

    await signIn(user);
    await user.type(await screen.findByLabelText(es["mfa.loginCode"]), "123456");
    await user.click(screen.getByRole("button", { name: es["mfa.verify"] }));

    expect(await screen.findByLabelText(es["login.password"])).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(es["apiError.invalid_mfa_token"]);
  });

  it("asks for the email code of an unverified account and then enters", async () => {
    vi.mocked(login).mockResolvedValue({
      emailVerificationRequired: true,
      verificationToken: "verify-token",
      email: "ana@test.com",
      expiration: "",
    });
    vi.mocked(verifyEmail).mockResolvedValue(session);
    const user = renderPage();

    await signIn(user);
    expect(await screen.findByText(es["emailVerification.body"].replace("{email}", "ana@test.com"))).toBeInTheDocument();
    await user.type(screen.getByLabelText(es["emailVerification.code"]), "654321");
    await user.click(screen.getByRole("button", { name: es["mfa.verify"] }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(verifyEmail).toHaveBeenCalledWith("verify-token", "654321");
  });

  it("links to the password reset, except in demo mode without an API", () => {
    const { unmount } = render(<LoginPage />);
    expect(screen.getByRole("link", { name: es["login.forgotPassword"] })).toHaveAttribute("href", "/forgot-password");
    unmount();

    vi.mocked(isUsingMockData).mockReturnValue(true);
    render(<LoginPage />);
    expect(screen.queryByRole("link", { name: es["login.forgotPassword"] })).not.toBeInTheDocument();
  });
});
