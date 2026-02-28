import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Code2, BrainCircuit } from 'lucide-react';

export default function HomePage() {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const createNewRoom = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const id = uuidv4();
        setRoomId(id);
        setError('');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            setError('Room ID and Username are required to join.');
            return;
        }

        // Navigate to the editor page and pass the username in the route state
        navigate(`/room/${roomId}`, {
            state: { username }
        });
    };

    const handleInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">
            <div className="w-full max-w-md bg-[#1e1e1e] p-8 rounded-xl shadow-2xl border border-[#333333]">
                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Code2 className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">CodeSync <span className="text-blue-400">AI</span></h1>
                </div>

                <h4 className="text-gray-400 mb-6 text-center">Paste invitation ROOM ID</h4>

                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        className="w-full p-3 bg-[#2d2d2d] rounded border border-[#404040] focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500"
                        placeholder="ROOM ID"
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type="text"
                        className="w-full p-3 bg-[#2d2d2d] rounded border border-[#404040] focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500"
                        placeholder="USERNAME"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        onKeyUp={handleInputEnter}
                    />

                    {error && <span className="text-red-400 text-sm">{error}</span>}

                    <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors mt-2"
                        onClick={joinRoom}
                    >
                        Join Room
                    </button>

                    <span className="text-center text-gray-500 text-sm mt-4">
                        If you don't have an invite then create &nbsp;
                        <a
                            onClick={createNewRoom}
                            href=""
                            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors underline decoration-blue-400/30 underline-offset-4"
                        >
                            new room
                        </a>
                    </span>

                    <div className="relative flex items-center py-5">
                        <div className="flex-grow border-t border-[#404040]"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">OR</span>
                        <div className="flex-grow border-t border-[#404040]"></div>
                    </div>

                    <button
                        onClick={() => navigate('/problems')}
                        className="w-full flex items-center justify-center gap-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold py-3 px-4 outline outline-1 outline-emerald-600/50 rounded transition-colors"
                    >
                        <BrainCircuit className="w-5 h-5" />
                        Practice DSA Problems
                    </button>
                </div>
            </div>
        </div>
    );
}