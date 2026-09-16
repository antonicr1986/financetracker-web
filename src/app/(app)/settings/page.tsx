"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
    getApiUrl,
    getDefaultApiUrl,
    getToken,
    setToken,
    setUser,
} from "@/lib/api/client";

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
    // El valor guardado se lee con useSyncExternalStore para que servidor y
    // cliente pinten lo mismo en el primer render. El borrador es lo que el
    // usuario esta escribiendo; mientras sea null manda lo guardado.
    const savedApiUrl = useSyncExternalStore(noop, getSavedApiUrl, () => "");
    const [draftApiUrl, setDraftApiUrl] = useState<string | null>(null);
    const apiUrl = draftApiUrl ?? savedApiUrl;
    const setApiUrl = setDraftApiUrl;
    const defaultApiUrl = getDefaultApiUrl();
    const effectiveApiUrl = getApiUrl();
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
            setError("Por favor ingresa una URL válida.");
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
            setError("No se pudo guardar la configuración.");
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
                setTestResult("✓ Conexión exitosa (credenciales inválidas, pero el servidor responde)");
            } else if (response.ok) {
                setTestResult("✓ Conexión exitosa");
            } else {
                setTestResult(
                    `✗ Error del servidor: ${response.status} ${response.statusText}`
                );
            }
        } catch (err) {
            setTestResult(
                `✗ No se pudo conectar: ${err instanceof Error ? err.message : "Error desconocido"}`
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
                        Configuración
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Configura la conexión a la API de FinanceTracker
                    </p>
                </header>

                <div className="space-y-6">
                    {/* API Configuration */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Conexión a API
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="apiUrl"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    URL de la API
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
                                        ? `Dejalo vacio para usar la de por defecto: ${defaultApiUrl}`
                                        : "Ejemplo: http://localhost:5279 o https://api.tu-dominio.com"}
                                </p>
                            </div>

                            {error && (
                                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                    {error}
                                </div>
                            )}

                            {isSaved && (
                                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    ✓ Configuración guardada correctamente
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                >
                                    Guardar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTestConnection}
                                    disabled={!apiUrl || isTesting}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                                >
                                    {isTesting ? "Probando..." : "Probar conexión"}
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
                            Estado
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    API URL
                                </p>
                                <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">
                                    {effectiveApiUrl || "No configurada"}
                                </p>
                                {!savedApiUrl && effectiveApiUrl && (
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Valor por defecto de la compilacion.
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Sesión
                                </p>
                                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                                    {token ? "Activa" : "Inactiva"}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full rounded-lg border border-rose-300 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </main>
    );
}