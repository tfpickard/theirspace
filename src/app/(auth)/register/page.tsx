import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <h1 className="module-title text-xl">Create your theirspace account</h1>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-4 text-sm">
            Already have an account? <Link href="/login" className="font-semibold">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
