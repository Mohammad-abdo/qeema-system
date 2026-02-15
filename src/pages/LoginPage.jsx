import { useState, Suspense, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertCircle, CheckCircle2, Loader2, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { error as notifyError } from "@/utils/notify";

const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_PROJECTS_BACKEND_URL || "http://127.0.0.1:4000";

function LoginForm() {
  const { t } = useTranslation();
  const { settings } = useSystemSettings();
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registered = searchParams.get("registered");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [backendUrl, setBackendUrl] = useState("");

  // التنقل للداشبورد بعد تحديث التوكن (تجنب العودة لصفحة الدخول)
  useEffect(() => {
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    fetch(`${apiBase.replace(/\/$/, "")}/health`, { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === "ok" || data?.service === "pms-backend") {
          setBackendStatus("connected");
          setBackendUrl(apiBase);
        } else {
          setBackendStatus("disconnected");
        }
      })
      .catch(() => setBackendStatus("disconnected"));
  }, [apiBase]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      await login(username, password);
      // لا نستدعي navigate هنا؛ useEffect سينقل للداشبورد عندما يتحدث token
    } catch (err) {
      const msg =
        backendStatus === "disconnected"
          ? t("auth.backendDisconnected")
          : t("auth.invalidCredentials");
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-lg bg-white p-1 shadow-sm">
              {settings.systemLogo && settings.systemLogo !== "/assets/logo.png" ? (
                <img src={settings.systemLogo} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <div className="h-full w-full bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                  Logo
                </div>
              )}
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{settings.systemName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{t("auth.signInToContinue")}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              {backendStatus === "checking" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">{t("auth.backendChecking")}</span>
                </>
              )}
              {backendStatus === "connected" && (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">{t("auth.backendConnected")}</span>
                  {backendUrl && (
                    <span className="text-muted-foreground truncate" title={backendUrl}>
                      ({backendUrl})
                    </span>
                  )}
                </>
              )}
              {backendStatus === "disconnected" && (
                <>
                  <WifiOff className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700">{t("auth.backendDisconnected")}</span>
                </>
              )}
            </div>

            {registered && (
              <Alert className="border-green-500 bg-green-50 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>{t("auth.success")}</AlertTitle>
                <AlertDescription>{t("auth.accountCreated")}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("auth.error")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.username")}</Label>
              <Input id="username" name="username" placeholder="admin" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full" type="submit" disabled={loading || backendStatus === "checking"}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("auth.signIn")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center">
          {backendStatus === "connected" && (
            <p className="text-xs text-muted-foreground">{t("auth.seedHint")}</p>
          )}
          {settings.allowRegistration && (
            <div className="text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-primary hover:underline">
                {t("auth.signUp")}
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
