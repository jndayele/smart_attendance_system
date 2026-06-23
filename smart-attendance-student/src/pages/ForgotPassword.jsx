import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout icon={KeyRound} title="Check your email" subtitle="We sent you a password reset link">
        <div className="text-center space-y-6">
          <p className="text-sm text-muted-foreground">
            We've sent an email to <span className="font-medium text-foreground">{email}</span> with instructions to reset your password.
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/login"><ArrowLeft className="w-4 h-4 mr-2" /> Back to log in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={KeyRound} title="Forgot password?" subtitle="No worries, we'll send you reset instructions.">
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Reset password"}
        </Button>
        <div className="text-center">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to log in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
