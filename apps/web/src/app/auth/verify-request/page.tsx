import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Mail className="size-10" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            A magic link has been sent to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please check your inbox and click the link to sign in. If you don't
            see it, check your spam folder.
          </p>
        </CardContent>
        <div className="p-6 pt-0">
          <Link href="/auth/signin">
            <Button variant="ghost" className="w-full gap-2">
              <ArrowLeft className="size-4" /> Back to Sign In
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
