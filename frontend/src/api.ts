export const executeCode = async (language: string, sourceCode: string) => {
    try {
        // Calling our own local backend now!
        const response = await fetch("http://localhost:5002/execute", {
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