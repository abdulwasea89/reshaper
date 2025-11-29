const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    try {
        console.log("Testing Native Gemini API (gemini-1.5-flash)...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);

        try {
            console.log("\nTesting Native Gemini API (gemini-2.0-flash-exp)...");
            const model2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const result2 = await model2.generateContent("Hello");
            console.log("Success:", result2.response.text());
        } catch (error2) {
            console.error("Error with gemini-2.0-flash-exp:", error2.message);
        }
    }
}

test();
