export type FAQItem = {
    question: string;
    answer: string;
};

export const FAQS: FAQItem[] = [
    {
        question: "How does the property listing process work?",
        answer: "Our platform makes listing properties simple. Upload property details, photos, and documents through our intuitive interface. Your listings are instantly visible to potential buyers or renters, with AI-powered optimization for maximum visibility."
    },
    {
        question: "What tools are available for property management?",
        answer: "We offer a comprehensive suite of tools including automated rent collection, maintenance request tracking, tenant screening, financial reporting, and document management. All these features are integrated seamlessly into one dashboard."
    },
    {
        question: "How secure are the transactions on your platform?",
        answer: "We implement bank-level security measures for all transactions. Our platform uses advanced encryption, secure payment gateways, and multi-factor authentication to ensure your financial transactions are completely safe."
    },
    {
        question: "Can I manage multiple properties efficiently?",
        answer: "Absolutely! Our platform is designed to handle multiple properties with ease. You can organize properties by portfolios, track performance metrics across all properties, and manage multiple tenant relationships from a single dashboard."
    },
    {
        question: "What kind of support do you provide?",
        answer: "We offer 24/7 customer support through multiple channels including live chat, email, and phone. Our dedicated support team is trained to help with technical issues, platform navigation, and best practices for property management."
    },
    {
        question: "Is there a mobile app available?",
        answer: "Yes, we have both iOS and Android apps available. The mobile apps offer all core functionalities of the web platform, allowing you to manage your properties on the go with real-time notifications and updates."
    }
];
