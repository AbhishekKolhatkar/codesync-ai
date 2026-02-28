import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import EditorPage from './pages/EditorPage';

// A temporary simple Home component to generate a room and redirect
function Home() {
  const createNewRoom = () => {
    const newRoomId = uuidv4();
    window.location.href = `/room/${newRoomId}`;
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#1e1e1e] text-white">
      <button
        onClick={createNewRoom}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold transition-colors"
      >
        Create New Coding Session
      </button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<EditorPage />} />
        {/* Catch-all route redirects to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;