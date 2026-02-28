import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Sparkles, X, Loader2 } from 'lucide-react';
import { socket } from '../socket';
import { executeCode, analyzeCodeWithAI } from '../api';
import ReactMarkdown from 'react-markdown';

import type { Problem } from '../api';

interface CodeEditorProps {
    roomId?: string;
    problemId?: string | null;
    problem?: Problem | null;
    nextProblemId?: string | null;
    onLanguageChange?: (language: string) => void;
}

export default function CodeEditor({ roomId, problemId: _problemId, problem, nextProblemId, onLanguageChange }: CodeEditorProps) {
    const [code, setCode] = useState(`console.log('Hello, interviews!');`);
    const [language, setLanguage] = useState('javascript');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const aiCache = useRef<Record<string, string>>({});

    useEffect(() => {
        socket.on('receive-code', (newCode: string) => {
            setCode(newCode);
        });
        return () => {
            socket.off('receive-code');
        };
    }, []);

    const handleAIReview = async () => {
        setIsAnalyzing(true);
        setIsModalOpen(true);

        const cacheKey = `${language}-${code}`;
        if (aiCache.current[cacheKey]) {
            setAiSummary(aiCache.current[cacheKey]);
            setIsAnalyzing(false);
            return;
        }

        const result = await analyzeCodeWithAI(language, code);
        aiCache.current[cacheKey] = result;
        setAiSummary(result);
        setIsAnalyzing(false);
    };

    const handleEditorChange = (value: string | undefined) => {
        const currentCode = value || "";
        setCode(currentCode);
        socket.emit('code-change', { roomId, code: currentCode });
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput("Running code...");
        const result = await executeCode(language, code);
        setOutput(result);
        setIsRunning(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            {/* Editor Toolbar */}
            <div className="h-12 border-b border-[#333333] flex items-center justify-between px-4 bg-[#181818]">
                <select
                    value={language}
                    onChange={(e) => {
                        setLanguage(e.target.value);
                        onLanguageChange?.(e.target.value);
                    }}
                    className="bg-[#2d2d2d] text-gray-300 px-3 py-1 rounded border border-[#404040] outline-none focus:border-blue-500"
                >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                </select>

                <div className="flex gap-3">
                    <button
                        onClick={handleAIReview}
                        disabled={isAnalyzing || isRunning}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded transition-colors disabled:opacity-50 font-semibold"
                    >
                        <Sparkles className="w-4 h-4" />
                        {isAnalyzing ? 'Analyzing...' : 'Ask AI'}
                    </button>

                    <button
                        onClick={handleRunCode}
                        disabled={isRunning || isAnalyzing}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded transition-colors disabled:opacity-50 font-semibold"
                    >
                        <Play className="w-4 h-4" />
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col lg:flex-row">
                {/* Code Editor */}
                <div className="flex-1 border-r border-[#333333]">
                    <Editor
                        height="100%"
                        language={language}
                        value={code}
                        theme="vs-dark"
                        onChange={handleEditorChange}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 16,
                            wordWrap: "on",
                            padding: { top: 20 },
                        }}
                    />
                </div>

                {/* Output Terminal */}
                <div className="h-64 lg:h-full lg:w-1/3 bg-[#1e1e1e] flex flex-col">
                    <div className="px-4 py-2 border-b border-[#333333] text-sm text-gray-400 font-semibold bg-[#181818]">
                        Output
                    </div>
                    <div className="flex-1 p-4 font-mono text-sm text-gray-300 overflow-y-auto whitespace-pre-wrap">
                        {output || "Click 'Run Code' to see the output here..."}
                    </div>
                </div>
            </div>

            {/* AI Review Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[#1e1e1e] border border-[#333333] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-[#333333] flex items-center justify-between bg-[#181818]">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                AI Code Review
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-[#333333]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center h-48 space-y-6">
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                                        <Loader2 className="relative w-12 h-12 text-purple-400 animate-spin" />
                                    </div>
                                    <p className="text-gray-300 font-medium animate-pulse text-lg">
                                        Analyzing your code...
                                    </p>
                                </div>
                            ) : (
                                <div className="text-gray-300 space-y-4 leading-relaxed [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_code]:bg-[#2d2d2d] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-purple-300 [&_pre]:bg-[#2d2d2d] [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:text-gray-300 [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 [&_strong]:text-white [&_strong]:font-semibold">
                                    <ReactMarkdown>{aiSummary}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                        {!isAnalyzing && (
                            <div className="px-6 py-4 border-t border-[#333333] bg-[#181818] flex justify-end">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-[#333333] hover:bg-[#404040] text-white px-5 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}