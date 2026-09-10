import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock } from "lucide-react";

// Every admin login is verified a second time through this mailbox.
const OTP_EMAIL = "infoquickkartnepal@gmail.com";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — Quick Kart Nepal" }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState(OTP_EMAIL);
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"password" | "otp">("password");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  // Step 1 runs entirely in the browser so the login works on any host,
  // without needing server-only backend keys.
  const checkPassword = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error("Invalid email or password");
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    // Drop the session immediately — access is only granted after the
    // emailed verification step below.
    await supabase.auth.signOut();
    if (!isAdmin) throw new Error("This account is not an administrator");
  };

  const sendCode = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email: OTP_EMAIL,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/admin/dashboard`,
      },
    });
    if (error) throw error;
  };


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (step === "password") {
        await verifyPassword({ data: { email, password } });
        await sendCode();
        setStep("otp");
        toast.success(`Verification sent to ${OTP_EMAIL}`);
      } else {
        const entry = code.trim();
        // Accept either the 6-digit code or the secure link pasted from the email,
        // so the admin can finish signing in without leaving this tab.
        if (entry.startsWith("http")) {
          const url = new URL(entry);
          const token = url.searchParams.get("token") ?? url.searchParams.get("token_hash");
          if (!token) throw new Error("That link does not contain a verification token");
          const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: "email" });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.verifyOtp({
            email: OTP_EMAIL,
            token: entry,
            type: "email",
          });
          if (error) throw error;
        }
        toast.success("Welcome back");
        nav({ to: "/admin/dashboard" });
      }

    } catch (e: any) {
      toast.error(e?.message ?? "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-display text-2xl text-primary">Admin Login</h1>
        <p className="mt-1 text-xs text-muted-foreground">Restricted access. Authorized personnel only.</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          {step === "password" ? (
            <>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Email" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Password" />
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                A verification message was sent to {OTP_EMAIL}. Enter the 6-digit code from that
                email — or paste the secure link from it here — to finish signing in on this tab.
              </p>
              <input autoComplete="one-time-code" required value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-center text-sm"
                placeholder="000000 or paste link" />
              <button type="button" onClick={() => sendCode().then(() => toast.success("Code re-sent")).catch((e) => toast.error(e?.message ?? "Could not resend"))}
                className="w-full text-xs text-muted-foreground underline">
                Resend code
              </button>
            </>
          )}
          <button disabled={busy} className="btn-gold w-full rounded-full py-2.5 text-sm font-semibold">
            {busy ? "Please wait…" : step === "password" ? "Continue" : "Verify & sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
