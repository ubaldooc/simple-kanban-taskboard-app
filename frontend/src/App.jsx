import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TaskboardProvider } from './context/TaskboardContext.jsx';
import { TaskboardView } from './components/TaskboardView.jsx';
import LoginPage from './pages/LoginPage.jsx';

function App() {
  return (
    <TaskboardProvider>
      <Routes>
        {/* La ruta principal ahora es pública y muestra el Taskboard */}
        <Route path="/" element={<TaskboardView />} />
        {/* La ruta de login sigue siendo pública */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </TaskboardProvider>
  );
}

export default App;
