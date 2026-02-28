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

export const getAIHint = async (problemId: string, language: string, sourceCode: string, hintsUsed: number) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/problems/${problemId}/hint`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language,
                code: sourceCode,
                hintsUsed
            }),
        });

        const data = await response.json();
        return data.hint || data.error;
    } catch (error) {
        console.error("AI Hint error:", error);
        return "Error analyzing code for a hint. Please try again.";
    }
};

export interface TestCase {
    _id?: string;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
}

export interface Problem {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description?: string;
    topics: string[];
    starterCode?: Record<string, string>;
    testCases?: TestCase[];
}

export const submitCode = async (problemId: string, language: string, sourceCode: string) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/problems/${problemId}/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language,
                code: sourceCode
            }),
        });

        return await response.json();
    } catch (error) {
        console.error("Submit error:", error);
        return { error: "Failed to submit code" };
    }
};

export const getProblems = async (): Promise<Problem[]> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/problems`);
        if (!response.ok) throw new Error("Failed to fetch problems");
        return await response.json();
    } catch (error) {
        console.error("Fetch problems error:", error);
        return [];
    }
};

export const getProblemById = async (id: string): Promise<Problem | null> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/problems/${id}`);
        if (!response.ok) throw new Error("Failed to fetch problem");
        return await response.json();
    } catch (error) {
        console.error("Fetch problem error:", error);
        return null;
    }
};
