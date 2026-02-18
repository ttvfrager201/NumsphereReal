"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "./ui/card";
import { supabase } from "../../supabase/supabase";

export default function PricingCard({ item, user }: {
    item: any,
    user: User | null
}) {
    // Handle checkout process
    const handleCheckout = async (priceId: string) => {
        if (!user) {
            // Redirect to login if user is not authenticated
            window.location.href = "/login?redirect=pricing";
            return;
        }


        try {
            const { data, error } = await supabase.functions.invoke('supabase-functions-create-checkout', {
                body: {
                    price_id: priceId,
                    user_id: user.id,
                    return_url: `${window.location.origin}/dashboard`,
                },
                headers: {
                    'X-Customer-Email': user.email || '',
                }
            });

            if (error) {
                throw error;
            }

            // Redirect to Stripe checkout
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
        }
    };

    return (
        <Card className={`w-full relative overflow-hidden bg-black border-white/10 text-white ${item.popular ? 'border-white ring-1 ring-white/50 shadow-2xl shadow-white/10 scale-105' : 'border-white/10'}`}>
             {item.popular && (
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none" />
            )}
            <CardHeader className="relative z-10">
                {item.popular && (
                    <div className="px-3 py-1 text-xs font-semibold text-black bg-white rounded-full w-fit mb-4">
                        Most Popular
                    </div>
                )}
                <CardTitle className="text-2xl font-bold tracking-tight text-white">{item.name}</CardTitle>
                <CardDescription className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold text-white">${item?.amount / 100}</span>
                    <span className="text-gray-500">/{item?.interval}</span>
                </CardDescription>
            </CardHeader>
            <CardFooter className="relative z-10">
                <Button
                    onClick={async () => {
                        await handleCheckout(item.id)
                    }}
                    className={`w-full py-6 text-lg font-medium ${item.popular ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    Get Started
                </Button>
            </CardFooter>
        </Card>
    )
}