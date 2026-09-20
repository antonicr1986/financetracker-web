"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
    getDefaultApiUrl,
    getToken,
    setToken,
    setUser,
} from "@/lib/api/client";
import { useT } from "@/lib/i18n/useT";

const STORAGE_KEY = "financetracker.api.url";

const noop = () => () => {};

/** Lo que hay guardado en el navegador, sin contar la URL por defecto. */
function getSavedApiUrl(): string {
    if (typeof window === "undefined") return "";
    try {
        return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
        return "";
    }
}

export default function SettingsPage() {
    const router = useRouter();
    const t = useT();
    // El valor guardado se lee con useSyncExternalStore para que servidor y
    // cliente pinten lo mismo en el primer render. El borrador es lo que el
    // usuario esta escribiendo; mientras sea null manda lo guardado.
    const savedApiUrl = useSyncExternalStore(noop, getSavedApiUrl, () => "");
    const [draftApiUrl, setDraftApiUrl] = useState<string | null>(null);
    const apiUrl = draftApiUrl ?? savedApiUrl;
    const setApiUrl = setDraftApiUrl;
    const defaultApiUrl = getDefaultApiUrl();
    // Derivada de savedApiUrl y no de getApiUrl(): esta ultima lee localStorage
    // directamente, que en el servidor no existe, y el texto renderizado no
    // coincidia con el del cliente.
    const effectiveApiUrl = savedApiUrl.trim().replace(/\/+$/, "") || defaultApiUrl;
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);
    const token = getToken();

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSaved(false);

        if (!apiUrl.trim()) {
            setError(t("settings.invalidUrl"));
            return;
        }

        try {
            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY, apiUrl);
                setDraftApiUrl(null);
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 3000);
            }
        } catch {
            setError(t("settings.saveFailed"));
        }
    }

    async function handleTestConnection() {
        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await fetch(`${apiUrl}/api/Users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "test@example.com",
                    password: "test",
                }),
            });

            if (response.status === 401) {
                setTestResult(t("settings.testOkUnauthorized"));
            } else if (response.ok) {
                setTestResult(t("settings.testOk"));
            } else {
                setTestResult(
                    t("settings.testServerError", {
                        status: response.status,
                        text: response.statusText,
                    })
                );
            }
        } catch (err) {
            setTestResult(
                t("settings.testFailed", {
                    reason: err instanceof Error ? err.message : t("settings.unknownError"),
                })
            );
        } finally {
            setIsTesting(false);
        }
    }

    function handleLogout() {
        setToken(null);
        setUser(null);
        router.push("/login");
    }

    return (
        <main>
            <div className="mx-auto max-w-2xl px-4 py-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                        {t("settings.title")}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {t("settings.subtitle")}
                    </p>
                </header>

                <div className="space-y-6">
                    {/* API Configuration */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {t("settings.apiSection")}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="apiUrl"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    {t("settings.apiUrl")}
                                </label>
                                <input
                                    id="apiUrl"
                                    type="url"
                                    value={apiUrl}
                                    onChange={(e) => setApiUrl(e.target.value)}
                                    placeholder="https://api.example.com"
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                                />
                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    {defaultApiUrl
                                        ? t("settings.useDefault", { url: defaultApiUrl })
                                        : t("settings.example")}
                                </p>
                            </div>

                            {error && (
                                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                    {error}
                                </div>
                            )}

                            {isSaved && (
                                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    {t("settings.saved")}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                >
                                    {t("settings.save")}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTestConnection}
                                    disabled={!apiUrl || isTesting}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                                >
                                    {isTesting ? t("settings.testing") : t("settings.test")}
                                </button>
                            </div>

                            {testResult && (
                                <div
                                    className={`rounded-lg px-3 py-2 text-sm ${testResult.startsWith("✓")
                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                            : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                        }`}
                                >
                                    {testResult}
                                </div>
                            )}
                        </form>
                    </section>

                    {/* Current Status */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {t("settings.status")}
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {t("settings.apiUrl")}
                                </p>
                                <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">
                                    {effectiveApiUrl || t("settings.notConfigured")}
                                </p>
                                {!savedApiUrl && effectiveApiUrl && (
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {t("settings.fromBuild")}
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {t("settings.session")}
                                </p>
                                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                                    {token ? t("settings.sessionActive") : t("settings.sessionInactive")}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full rounded-lg border border-rose-300 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950"
                    >
                        {t("settings.signOut")}
                    </button>
                </div>
            </div>
        </main>
    );
}