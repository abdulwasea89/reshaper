export type PlanFeature = {
    text: string;
    included: boolean;
};

export type Plan = {
    name: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    features: PlanFeature[];
    popular?: boolean;
};

export const PRICING_PLANS: Plan[] = [
    {
        name: "Basic",
        description: "Perfect for individual agents",
        price: {
            monthly: 29,
            yearly: 290,
        },
        features: [
            { text: "Property Listings (up to 20)", included: true },
            { text: "Basic Analytics", included: true },
            { text: "Lead Management", included: true },
            { text: "Email Support", included: true },
            { text: "Virtual Tours", included: false },
            { text: "Advanced Analytics", included: false },
        ],
    },
    {
        name: "Professional",
        description: "Ideal for growing agencies",
        price: {
            monthly: 79,
            yearly: 790,
        },
        popular: true,
        features: [
            { text: "Unlimited Property Listings", included: true },
            { text: "Advanced Analytics", included: true },
            { text: "Lead Management", included: true },
            { text: "Priority Support", included: true },
            { text: "Virtual Tours", included: true },
            { text: "Marketing Tools", included: true },
        ],
    },
    {
        name: "Enterprise",
        description: "For large real estate firms",
        price: {
            monthly: 199,
            yearly: 1990,
        },
        features: [
            { text: "Unlimited Property Listings", included: true },
            { text: "Custom Analytics", included: true },
            { text: "Team Management", included: true },
            { text: "24/7 Support", included: true },
            { text: "API Access", included: true },
            { text: "White Labeling", included: true },
        ],
    },
];
