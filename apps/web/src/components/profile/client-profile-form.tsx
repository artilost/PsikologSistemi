"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
    dateOfBirth: z.string().min(1, "Doğum tarihi zorunludur"),
    gender: z.string().min(1, "Cinsiyet zorunludur"),
    occupation: z.string().optional(),
    emergContact: z.string().min(1, "Acil durum kişisi zorunludur"),
    emergPhone: z.string().min(1, "Acil durum telefonu zorunludur"),
    address: z.string().min(1, "Adres zorunludur"),
    medicalHistory: z.string().optional(),
    currentMedication: z.string().optional(),
    allergies: z.string().optional(),
    referredBy: z.string().optional(),
});

export function ClientProfileForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dateOfBirth: "",
            gender: "",
            occupation: "",
            emergContact: "",
            emergPhone: "",
            address: "",
            medicalHistory: "",
            currentMedication: "",
            allergies: "",
            referredBy: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await usersApi.updateClientProfile(values);
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
                <CardTitle>Danışan Profilinizi Tamamlayın</CardTitle>
                <CardDescription>
                    Size daha iyi hizmet verebilmemiz için lütfen kişisel bilgilerinizi doldurun.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Doğum Tarihi</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cinsiyet</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Cinsiyet seçin" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="male">Erkek</SelectItem>
                                                <SelectItem value="female">Kadın</SelectItem>
                                                <SelectItem value="other">Diğer</SelectItem>
                                                <SelectItem value="prefer_not_to_say">Belirtmek İstemiyorum</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="occupation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meslek</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn. Yazılım Mühendisi" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="emergContact"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Acil Durum Kişisi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ad Soyad" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="emergPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Acil Durum Telefonu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+90..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adres</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Tam adresiniz..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Tıbbi Bilgiler (İsteğe Bağlı)</h3>

                            <FormField
                                control={form.control}
                                name="medicalHistory"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tıbbi Geçmiş</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Önemli tıbbi geçmişiniz..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="currentMedication"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kullandığınız İlaçlar</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Şu an kullandığınız ilaçlar..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="allergies"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alerjiler</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Varsa alerjileriniz..." {...field} />
                                        </FormControl>
                                        <FormMessage />
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
