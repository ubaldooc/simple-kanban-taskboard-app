import React from 'react';
import { TaskboardProvider } from './context/TaskboardContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { TaskboardView } from './components/TaskboardView';

function App() {
  return (
    <AuthProvider>
      <TaskboardProvider>
        <TaskboardView />
      </TaskboardProvider>
    </AuthProvider>
  );
}

export default App;
