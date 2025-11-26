export interface PerkItem {
    title: string;
    description: string;
    icon: string;
}

export const PERKS: PerkItem[] = [
    {
        title: "Property Sync",
        description: "Sync listings across platforms instantly.",
        icon: "/icons/perk-one.svg"
    },
    {
        title: "Smart Analytics",
        description: "Track performance with realtime insights.",
        icon: "/icons/perk-two.svg"
    },
    {
        title: "Doc Manager",
        description: "Handle documents and esigns easily.",
        icon: "/icons/perk-three.svg"
    },
    {
        title: "Lead Connect",
        description: "Manage all property inquiries centrally.",
        icon: "/icons/perk-four.svg"
    }
]; 