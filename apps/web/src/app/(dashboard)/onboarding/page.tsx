"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TherapistProfileForm } from "@/components/profile/therapist-profile-form";
import { ClientProfileForm } from "@/components/profile/client-profile-form";
import { authApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const { status } = useSession();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkProfile() {
            if (status === "loading") return;

            if (status === "unauthenticated") {
                router.push("/login");
                return;
            }

            try {
                const response = await authApi.me();
                const user = response.data.data;
                setUserRole(user.role);

                // Check if profile is already completed (simple check)
                // In a real app, we would check specific fields
                if (user.role === "THERAPIST" && user.therapistProfile?.licenseNumber) {
                    router.push("/dashboard");
                } else if (user.role === "CLIENT" && user.clientProfile?.dateOfBirth) {
                    router.push("/dashboard");
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setIsLoading(false);
            }
        }

        checkProfile();
    }, [status, router]);

    if (isLoading || status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-10">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Psikolog Sistemine Hoş Geldiniz</h1>
                <p className="text-muted-foreground mt-2">
                    Devam etmek için lütfen profilinizi tamamlayın.
                </p>
            </div>

            {userRole === "THERAPIST" ? (
                <TherapistProfileForm />
            ) : userRole === "CLIENT" ? (
                <ClientProfileForm />
            ) : (
                <div className="text-center text-red-500">
                    Bilinmeyen rol. Lütfen destek ile iletişime geçin.
                </div>
            )}
        </div>
    );
}
