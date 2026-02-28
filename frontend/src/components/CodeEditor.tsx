import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play } from 'lucide-react';
import { socket } from '../socket';
import { executeCode } from '../api';

interface CodeEditorProps {
    roomId?: string;
}

export default function CodeEditor({ roomId }: CodeEditorProps) {
    const [code, setCode] = useState(`console.log('Hello, interviews!');`);
    const [language, setLanguage] = useState('javascript');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        socket.on('receive-code', (newCode: string) => {
            setCode(newCode);
        });
        return () => {
            socket.off('receive-code');
        };
    }, []);

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
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-[#2d2d2d] text-gray-300 px-3 py-1 rounded border border-[#404040] outline-none focus:border-blue-500"
                >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                </select>

                <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                    <Play className="w-4 h-4" />
                    {isRunning ? 'Running...' : 'Run Code'}
                </button>
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
        </div>
    );
}