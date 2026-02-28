import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import { Code2, FolderTree, Settings, Users } from 'lucide-react';
import { socket } from '../socket';

export default function EditorPage() {
    // Extract the roomId from the URL (e.g., /room/12345)
    const { roomId } = useParams();

    useEffect(() => {
        socket.connect();

        // Tell the backend to put this user in this specific room
        if (roomId) {
            socket.emit('join-room', roomId);
        }

        return () => {
            socket.disconnect();
        };
    }, [roomId]);

    return (
        <div className="flex h-screen bg-[#1e1e1e] text-gray-400 overflow-hidden">
            {/* Activity Bar */}
            <div className="w-14 border-r border-[#333333] flex flex-col items-center py-4 bg-[#181818] gap-6">
                <div className="p-2 bg-blue-500/10 rounded-xl cursor-pointer hover:text-white transition-colors">
                    <Code2 className="w-6 h-6 text-blue-400" />
                </div>
                <FolderTree className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
                <Users className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
                <div className="mt-auto">
                    <Settings className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <div className="h-10 border-b border-[#333333] flex items-center justify-between px-4 bg-[#181818]">
                    <div className="px-3 py-1 bg-[#1e1e1e] border-t border-blue-400 text-gray-200 text-sm flex items-center gap-2">
                        <span className="text-blue-400">TS</span> index.ts
                    </div>
                    <div className="text-xs bg-gray-800 px-2 py-1 rounded">
                        Room: {roomId?.slice(0, 8)}...
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 relative">
                    <CodeEditor roomId={roomId} />
                </div>
            </div>
        </div>
    );
}