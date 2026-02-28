const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';

export const executeCode = async (language: string, sourceCode: string) => {
    try {
        // Calling our own local backend now!
        const response = await fetch(`${BACKEND_URL}/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language,
                sourceCode
            }),
        });

        const data = await response.json();
        return data.output || data.error;
    } catch (error) {
        console.error("Execution error:", error);
        return "Error executing code. Please try again.";
    }
};

export const analyzeCodeWithAI = async (language: string, sourceCode: string) => {
    try {
        const response = await fetch(`${BACKEND_URL}/ai-review`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language,
                code: sourceCode
            }),
        });

        const data = await response.json();
        return data.review || data.error;
    } catch (error) {
        console.error("AI execution error:", error);
        return "Error analyzing code. Please try again.";
    }
};