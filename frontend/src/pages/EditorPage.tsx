import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import { Code2 } from 'lucide-react';
import { socket } from '../socket';

export default function EditorPage() {
    // Extract the roomId from the URL (e.g., /room/12345)
    const { roomId } = useParams();
    const location = useLocation();
    const username = location.state?.username || "Anonymous Visitor";
    const [currentLanguage, setCurrentLanguage] = useState('javascript');

    useEffect(() => {
        socket.connect();

        // Tell the backend to put this user in this specific room
        if (roomId) {
            socket.emit('join-room', { roomId, username });
        }

        return () => {
            socket.disconnect();
        };
    }, [roomId, username]);

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
        <div className="flex h-screen bg-[#1e1e1e] text-gray-400 overflow-hidden">
            {/* Activity Bar */}
            <div className="w-14 border-r border-[#333333] flex flex-col items-center py-4 bg-[#181818] gap-6">
                <div className="p-2 bg-blue-500/10 rounded-xl cursor-pointer hover:text-white transition-colors">
                    <Code2 className="w-6 h-6 text-blue-400" />
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <div className="h-10 border-b border-[#333333] flex items-center justify-between px-4 bg-[#181818]">
                    <div className={`px-3 py-1 bg-[#1e1e1e] border-t ${langInfo.border} text-gray-200 text-sm flex items-center gap-2`}>
                        <span className={langInfo.color}>{langInfo.badge}</span> index.{langInfo.ext}
                    </div>
                    <div className="text-xs bg-gray-800 px-2 py-1 rounded">
                        Room: {roomId?.slice(0, 8)}...
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 relative">
                    <CodeEditor roomId={roomId} onLanguageChange={setCurrentLanguage} />
                </div>
            </div>
        </div>
    );
}