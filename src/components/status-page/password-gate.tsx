import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatusPageBranding } from "@/database/schema/status-pages";

interface PasswordGateProps {
  title: string;
  branding?: StatusPageBranding;
  onSubmit: (password: string) => void;
  error?: string;
  isLoading?: boolean;
}

export function PasswordGate({ title, branding, onSubmit, error, isLoading }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: branding?.backgroundColor || undefined,
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {branding?.logoUrl && (
            <img
              src={branding.logoUrl}
              alt={title}
              className="h-16 w-auto mx-auto mb-4 object-contain"
            />
          )}
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            This status page is password protected. Please enter the password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !password}>
              {isLoading ? "Verifying..." : "Access Status Page"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
