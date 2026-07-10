import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/reset-password`,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <MailCheck className="text-muted-foreground size-6" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              If an account exists for <span className="font-medium">{email}</span>, we&apos;ve
              sent a link to reset your password. It expires shortly, so use it soon.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/login" className="text-sm underline underline-offset-4">
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your account email and we&apos;ll send you a link to set a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Send reset link
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-sm">
            Remembered it?{" "}
            <Link to="/login" className="text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
