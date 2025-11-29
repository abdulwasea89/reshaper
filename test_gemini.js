const { OpenAI } = require("openai");

const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function test() {
    try {
        console.log("Testing Gemini API...");
        const response = await client.chat.completions.create({
            model: "gemini-1.5-pro",
            messages: [{ role: "user", content: "Hello" }],
        });
        console.log("Success:", response.choices[0].message);
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
