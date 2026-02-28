import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route to our new sleek dashboard */}
        <Route path="/" element={<HomePage />} />

        {/* Route to the collaborative editor */}
        <Route path="/room/:roomId" element={<EditorPage />} />

        {/* Catch-all route redirects to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;