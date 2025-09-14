import React from 'react';
import { TaskboardProvider } from './context/TaskboardContext.jsx';
import { TaskboardView } from './components/TaskboardView';

function App() {
  return (
    <TaskboardProvider>
      <TaskboardView />
    </TaskboardProvider>
  );
}

export default App;
