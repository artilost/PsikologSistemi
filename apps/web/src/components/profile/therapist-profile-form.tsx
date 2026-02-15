"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
    licenseNumber: z.string().min(1, "Lisans numarası zorunludur"),
    specialization: z.string().min(1, "En az bir uzmanlık alanı gereklidir"), // Comma separated for now
    biography: z.string().min(10, "Biyografi en az 10 karakter olmalıdır"),
    yearsExperience: z.coerce.number().min(0, "Deneyim yılı pozitif olmalıdır"),
    hourlyRate: z.coerce.number().min(0, "Saatlik ücret pozitif olmalıdır"),
    sessionDuration: z.coerce.number().min(15, "Seans süresi en az 15 dakika olmalıdır"),
    breakDuration: z.coerce.number().min(0, "Mola süresi pozitif olmalıdır"),
    allowOnlineBooking: z.boolean().default(true),
    autoConfirmAppointment: z.boolean().default(false),
});

export function TherapistProfileForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            licenseNumber: "",
            specialization: "",
            biography: "",
            yearsExperience: 0,
            hourlyRate: 0,
            sessionDuration: 50,
            breakDuration: 10,
            allowOnlineBooking: true,
            autoConfirmAppointment: false,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const formattedValues = {
                ...values,
                specialization: values.specialization.split(",").map((s) => s.trim()),
            };

            await usersApi.updateTherapistProfile(formattedValues);
            toast.success("Profil başarıyla güncellendi");
            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Profil güncellenemedi");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Terapist Profilinizi Tamamlayın</CardTitle>
                <CardDescription>
                    Randevu kabul etmeye başlamak için lütfen profesyonel bilgilerinizi girin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="licenseNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lisans Numarası</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn. 12345678" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="specialization"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Uzmanlık Alanları (virgülle ayırın)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn. BDT, Kaygı, Depresyon" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Uzmanlık alanlarınızı virgülle ayırarak listeleyin.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="yearsExperience"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deneyim (Yıl)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="hourlyRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Saatlik Ücret (TL)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sessionDuration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Seans Süresi (dakika)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Her seans için ayrılan süre
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="breakDuration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mola Süresi (dakika)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Seanslar arası mola süresi (örn: 10 dakika)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="biography"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Biyografi</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Geçmişiniz ve yaklaşımınız hakkında bilgi verin..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-4">
                            <FormField
                                control={form.control}
                                name="allowOnlineBooking"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Online Randevuya İzin Ver</FormLabel>
                                            <FormDescription>
                                                Danışanlar platform üzerinden doğrudan randevu alabilir.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="autoConfirmAppointment"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Randevuları Otomatik Onayla</FormLabel>
                                            <FormDescription>
                                                Randevular alındığında otomatik olarak onaylanır.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Kaydediliyor..." : "Profili Kaydet"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
