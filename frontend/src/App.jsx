import React from 'react';
import { useTaskboard } from './hooks/useTaskboard';
import { TaskboardView } from './components/TaskboardView';

function App() {
  const taskboard = useTaskboard();

  return <TaskboardView taskboard={taskboard} />;
}

export default App;