import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@/test/pageMocks";
import ForgotPasswordPage from "./page";
import { ApiError, forgotPassword, resetPassword } from "@/lib/api/client";
import { es } from "@/lib/i18n/messages";
import { setLocale } from "@/lib/i18n/locale";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return { ...actual, forgotPassword: vi.fn(), resetPassword: vi.fn() };
});

const NEW_PASSWORD = "una-clave-nueva-larga";

function renderPage() {
  render(<ForgotPasswordPage />);
  return userEvent.setup();
}

async function reachCodeStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(es["login.email"]), " ana@test.com ");
  await user.click(screen.getByRole("button", { name: es["passwordReset.send"] }));
  await screen.findByLabelText(es["emailVerification.code"]);
}

async function submitReset(
  user: ReturnType<typeof userEvent.setup>,
  values: { code?: string; password?: string; confirmation?: string } = {},
) {
  const { code = "123456", password = NEW_PASSWORD } = values;
  const confirmation = values.confirmation ?? password;
  if (code) await user.type(screen.getByLabelText(es["emailVerification.code"]), code);
  await user.type(screen.getByLabelText(es["passwordReset.newPassword"]), password);
  await user.type(screen.getByLabelText(es["register.confirm"]), confirmation);
  await user.click(screen.getByRole("button", { name: es["passwordReset.submit"] }));
}

beforeEach(() => {
  setLocale("es");
  vi.mocked(forgotPassword).mockReset().mockResolvedValue();
  vi.mocked(resetPassword).mockReset().mockResolvedValue();
});

describe("ForgotPasswordPage", () => {
  it("rejects a broken email before calling the API", async () => {
    const user = renderPage();

    await user.type(screen.getByLabelText(es["login.email"]), "ana@test");
    await user.click(screen.getByRole("button", { name: es["passwordReset.send"] }));

    expect(await screen.findByRole("alert")).toHaveTextContent(es["passwordReset.invalidEmail"]);
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("asks for the code, says where it went and hints Google accounts", async () => {
    const user = renderPage();

    await reachCodeStep(user);

    expect(forgotPassword).toHaveBeenCalledWith("ana@test.com");
    expect(screen.getByText(es["passwordReset.codeSent"].replace("{email}", "ana@test.com"))).toBeInTheDocument();
    expect(screen.getByText(es["passwordReset.googleHint"])).toBeInTheDocument();
  });

  it.each([
    ["a short code", { code: "12345" }, "passwordReset.codeFormat"],
    ["a short password", { password: "corta" }, "errors.passwordTooShort"],
    ["two different passwords", { confirmation: "otra-clave-nueva" }, "errors.passwordsDontMatch"],
  ] as const)("checks %s before calling the API", async (_, values, message) => {
    const user = renderPage();
    await reachCodeStep(user);

    await submitReset(user, values);

    expect(await screen.findByRole("alert")).toHaveTextContent(es[message]);
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("changes the password and offers to sign in", async () => {
    const user = renderPage();
    await reachCodeStep(user);

    await submitReset(user);

    expect(await screen.findByText(es["passwordReset.done"])).toBeInTheDocument();
    expect(resetPassword).toHaveBeenCalledWith("ana@test.com", "123456", NEW_PASSWORD);
    expect(screen.getByRole("link", { name: es["passwordReset.goToLogin"] })).toHaveAttribute("href", "/login");
  });

  it("clears an expired code so the new one can be typed", async () => {
    vi.mocked(resetPassword).mockRejectedValue(new ApiError("invalid_request", 400, "reset_code_expired"));
    const user = renderPage();
    await reachCodeStep(user);

    await submitReset(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(es["apiError.reset_code_expired"]);
    expect(screen.getByLabelText(es["emailVerification.code"])).toHaveValue("");
  });

  it("keeps a wrong code to fix it", async () => {
    vi.mocked(resetPassword).mockRejectedValue(new ApiError("invalid_request", 400, "invalid_reset_code"));
    const user = renderPage();
    await reachCodeStep(user);

    await submitReset(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(es["apiError.invalid_reset_code"]);
    expect(screen.getByLabelText(es["emailVerification.code"])).toHaveValue("123456");
  });

  it("resends the code to the same email", async () => {
    const user = renderPage();
    await reachCodeStep(user);

    await user.click(screen.getByRole("button", { name: es["emailVerification.resend"] }));

    await waitFor(() => expect(forgotPassword).toHaveBeenCalledTimes(2));
    expect(forgotPassword).toHaveBeenLastCalledWith("ana@test.com");
  });

  it("goes back to the email step", async () => {
    const user = renderPage();
    await reachCodeStep(user);

    await user.click(screen.getByRole("button", { name: es["mfa.back"] }));

    expect(await screen.findByRole("button", { name: es["passwordReset.send"] })).toBeInTheDocument();
  });

  it("shows the password with the eye button", async () => {
    const user = renderPage();
    await reachCodeStep(user);
    const input = screen.getByLabelText(es["passwordReset.newPassword"]);

    expect(input).toHaveAttribute("type", "password");
    await user.click(screen.getAllByRole("button", { name: es["login.showPassword"] })[0]);

    expect(input).toHaveAttribute("type", "text");
  });
});
