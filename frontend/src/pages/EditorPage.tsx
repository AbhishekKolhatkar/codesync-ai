import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import { FileText, List, CheckCircle } from 'lucide-react';
import { socket } from '../socket';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { getProblemById, getProblems } from '../api';
import type { Problem } from '../api';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export default function EditorPage() {
    // Extract the roomId from the URL (e.g., /room/12345)
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const username = location.state?.username || "Anonymous Visitor";

    const solvedProblems = useSelector((state: RootState) => state.progress.solvedProblems);

    // Parse problemId from query params
    const queryParams = new URLSearchParams(location.search);
    const problemId = queryParams.get('problemId');

    const [currentLanguage, setCurrentLanguage] = useState('javascript');
    const [problem, setProblem] = useState<Problem | null>(null);
    const [allProblems, setAllProblems] = useState<Problem[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (problemId) {
            getProblemById(problemId).then(data => setProblem(data));
        }
        getProblems().then(data => setAllProblems(data));
    }, [problemId]);

    // Find the next problem
    const currentProblemIndex = allProblems.findIndex(p => p.id === problemId);
    const nextProblemId = currentProblemIndex >= 0 && currentProblemIndex < allProblems.length - 1
        ? allProblems[currentProblemIndex + 1].id
        : null;

    const handleProblemSelect = (id: string) => {
        navigate(`/room/${roomId}?problemId=${id}`, { state: { username } });
    };

    useEffect(() => {
        socket.connect();

        // Tell the backend to put this user in this specific room
        if (roomId) {
            socket.emit('join-room', { roomId, username, problemId });
        }

        return () => {
            socket.disconnect();
        };
    }, [roomId, username, problemId]);

    const getLanguageInfo = (lang: string) => {
        switch (lang) {
            case 'javascript': return { ext: 'js', badge: 'JS', color: 'text-yellow-400', border: 'border-yellow-400' };
            case 'typescript': return { ext: 'ts', badge: 'TS', color: 'text-blue-400', border: 'border-blue-400' };
            case 'python': return { ext: 'py', badge: 'PY', color: 'text-green-400', border: 'border-green-400' };
            case 'java': return { ext: 'java', badge: 'JAVA', color: 'text-orange-400', border: 'border-orange-400' };
            case 'cpp': return { ext: 'cpp', badge: 'C++', color: 'text-blue-500', border: 'border-blue-500' };
            case 'csharp': return { ext: 'cs', badge: 'C#', color: 'text-purple-500', border: 'border-purple-500' };
            case 'go': return { ext: 'go', badge: 'GO', color: 'text-cyan-400', border: 'border-cyan-400' };
            case 'rust': return { ext: 'rs', badge: 'RS', color: 'text-orange-500', border: 'border-orange-500' };
            default: return { ext: 'js', badge: 'JS', color: 'text-yellow-400', border: 'border-yellow-400' };
        }
    };

    const langInfo = getLanguageInfo(currentLanguage);

    return (
        <div className="flex h-screen bg-[#1e1e1e] text-gray-400 overflow-hidden font-sans">

            {/* Collapsible Problem List Sidebar */}
            <div
                className={`bg-[#141414] border-r border-[#333333] flex flex-col transition-all duration-300 ease-in-out z-10 shrink-0 ${isSidebarOpen ? 'w-64' : 'w-0 border-r-0'}`}
                style={{ overflow: isSidebarOpen ? 'hidden' : 'hidden' }}
            >
                <div className="h-12 border-b border-[#333333] flex items-center px-4 shrink-0 bg-[#181818] text-white font-semibold">
                    Problems
                </div>
                <div className="flex-1 overflow-y-auto w-64 p-2 space-y-1 scrollbar-thin scrollbar-thumb-[#333]">
                    {allProblems.map((p, idx) => {
                        const isSolved = solvedProblems.includes(p.id);
                        return (
                            <div
                                key={p.id}
                                onClick={() => handleProblemSelect(p.id)}
                                className={`px-3 py-2 rounded-lg cursor-pointer text-sm flex items-center justify-between transition-colors ${p.id === problemId ? 'bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30' : 'hover:bg-[#252525] text-gray-300 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <span className="text-gray-500 text-xs w-4">{idx + 1}.</span>
                                    <span className="truncate">{p.title}</span>
                                </div>
                                {isSolved && <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Split Workspace */}
            <Group id="main-editor-group" orientation="horizontal" className="flex-1 w-full h-full">

                {/* Left Panel: Problem Description */}
                {problemId && (
                    <Panel
                        id="problem-panel"
                        defaultSize={40}
                        minSize={25}
                        collapsible
                        className={`bg-[#0f0f0f] border-r border-[#333333] flex flex-col min-w-0`}
                    >
                        <div className="h-10 border-b border-[#333333] flex items-center px-4 bg-[#181818] shrink-0 sticky top-0 justify-between">
                            <div className="flex items-center gap-2 text-gray-200 text-sm font-medium">
                                <div
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="p-1.5 -ml-1.5 rounded hover:bg-[#333] cursor-pointer transition-colors text-gray-400 hover:text-white"
                                    title="Toggle Problem List"
                                >
                                    <List className="w-4 h-4" />
                                </div>
                                <FileText className="w-4 h-4 text-emerald-400 ml-1" />
                                Problem Description
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${problem?.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                                problem?.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                }`}>
                                {problem?.difficulty}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
                            {problem ? (
                                <div className="prose prose-invert prose-emerald max-w-none">
                                    <h1 className="text-3xl font-bold text-white mb-6 tracking-tight">{problem.title}</h1>

                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {problem.topics.map(t => (
                                            <span key={t} className="px-2 py-1 bg-[#252525] hover:bg-[#333] cursor-pointer text-gray-400 text-xs rounded-lg transition-colors">
                                                {t}
                                            </span>
                                        ))}
                                    </div>

                                    <div
                                        className="text-gray-300 leading-relaxed text-[15px] space-y-4"
                                        dangerouslySetInnerHTML={{ __html: problem.description || 'No description available.' }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    Fetching problem details...
                                </div>
                            )}
                        </div>
                    </Panel>
                )}

                {/* Custom Resizer */}
                {problemId && (
                    <Separator className="w-2 focus:outline-none hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors flex items-center justify-center group cursor-col-resize z-20 relative">
                        <div className="h-12 w-1 bg-[#333] group-hover:bg-emerald-500 group-active:bg-emerald-400 rounded-full transition-colors" />
                    </Separator>
                )}

                {/* Right Panel: Code Editor */}
                <Panel id="editor-panel" defaultSize={problemId ? 60 : 100} minSize={30} className="flex flex-col min-w-0 bg-[#1e1e1e]">
                    <div className="h-10 border-b border-[#333333] flex items-center justify-between px-4 bg-[#181818] shrink-0 sticky top-0">
                        <div className={`px-3 py-1 bg-[#1e1e1e] border-t-2 ${langInfo.border} text-gray-200 text-sm flex items-center gap-2 font-mono h-full`}>
                            <span className={langInfo.color}>{langInfo.badge}</span> {problem ? `solution.${langInfo.ext}` : `index.${langInfo.ext}`}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-xs bg-[#252525] px-2.5 py-1 rounded text-gray-400 border border-[#333] font-mono">
                                Room: {roomId?.slice(0, 8)}...
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 relative min-h-0 bg-[#0d0d0d]">
                        <CodeEditor key={problemId || "default-editor"} roomId={roomId} problemId={problemId} problem={problem} nextProblemId={nextProblemId} onLanguageChange={setCurrentLanguage} />
                    </div>
                </Panel>
            </Group>
        </div>
    );
}