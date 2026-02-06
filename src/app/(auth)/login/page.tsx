import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">Welcome back to theirspace</h1>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-sm">
            Need an account? <Link href="/register" className="font-semibold">Register</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
