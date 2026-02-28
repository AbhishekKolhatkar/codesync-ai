import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProblems } from '../api';
import type { Problem } from '../api';
import { v4 as uuidV4 } from 'uuid';
import { Search, BrainCircuit, PlaySquare, CheckCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export default function ProblemsPage() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const solvedProblems = useSelector((state: RootState) => state.progress.solvedProblems);
    const attemptedProblems = useSelector((state: RootState) => state.progress.attemptedProblems);

    useEffect(() => {
        const fetchProblems = async () => {
            const data = await getProblems();
            setProblems(data);
            setLoading(false);
        };
        fetchProblems();
    }, []);

    const handleSolve = (problemId: string) => {
        // Generate a random room ID so users can collaborate or work alone
        const roomId = uuidV4();
        navigate(`/room/${roomId}?problemId=${problemId}`, {
            state: { username: 'Guest' }
        });
    };

    const filteredProblems = problems.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.topics.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-8 font-sans selection:bg-blue-500/30">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight flex items-center gap-3">
                            <BrainCircuit className="w-10 h-10 text-blue-500" />
                            DSA Practice
                        </h1>
                        <p className="text-gray-400 text-lg">Master algorithms and data structures through collaborative coding.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                        <div className="text-center px-4 border-r border-white/10">
                            <div className="text-2xl font-bold text-white">{problems.length}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Problems</div>
                        </div>
                        <div className="text-center px-4 border-r border-white/10">
                            <div className="text-2xl font-bold text-emerald-400">{solvedProblems.length}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Solved</div>
                        </div>
                        <div className="text-center px-4">
                            <div className="text-2xl font-bold text-orange-400">{attemptedProblems.length}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Attempted</div>
                        </div>
                    </div>
                </header>

                <div className="mb-8 relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search problems by name or topic..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                    />
                </div>

                <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
                                <th className="p-5 font-semibold text-gray-400 text-sm uppercase tracking-wider">Status</th>
                                <th className="p-5 font-semibold text-gray-400 text-sm uppercase tracking-wider">Title</th>
                                <th className="p-5 font-semibold text-gray-400 text-sm uppercase tracking-wider">Difficulty</th>
                                <th className="p-5 font-semibold text-gray-400 text-sm uppercase tracking-wider">Topics</th>
                                <th className="p-5 text-right font-semibold text-gray-400 text-sm uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            Loading problems...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProblems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500">No problems found matching your search.</td>
                                </tr>
                            ) : (
                                filteredProblems.map((problem) => (
                                    <tr key={problem.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1e1e1e] transition-colors group">
                                        <td className="p-5 w-16 text-center">
                                            {solvedProblems.includes(problem.id) ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-gray-600 mx-auto group-hover:border-gray-500 transition-colors"></div>
                                            )}
                                        </td>
                                        <td className="p-5 font-medium text-white text-lg">
                                            {problem.title}
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                    'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {problem.difficulty}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-wrap gap-2">
                                                {problem.topics.slice(0, 3).map((topic, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-[#252525] text-gray-400 text-xs rounded-lg border border-[#333]">
                                                        {topic}
                                                    </span>
                                                ))}
                                                {problem.topics.length > 3 && (
                                                    <span className="px-2.5 py-1 bg-[#252525] text-gray-500 text-xs rounded-lg">
                                                        +{problem.topics.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => handleSolve(problem.id)}
                                                className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition-all active:scale-95"
                                            >
                                                <PlaySquare className="w-4 h-4" />
                                                Solve
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
