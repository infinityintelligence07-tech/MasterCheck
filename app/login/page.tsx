import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { MasterCheckLogo } from "@/components/layout/mastercheck-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-3 text-center">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            IAM Treinamentos
          </p>
          <MasterCheckLogo size="lg" priority />
          <p className="text-sm text-muted-foreground">
            Painel interno de conferência das MasterClasses
          </p>
        </div>

        <Card className="border-border bg-card shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Entrar</CardTitle>
            <CardDescription>
              Use e-mail e senha ou peça um link mágico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoginSkeleton />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function LoginSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
