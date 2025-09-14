import React, { createContext, useContext } from 'react';
import { useTaskboard } from '../hooks/useTaskboard';

// const TaskboardContext = createContext();
const TaskboardContext = createContext(null); // O podrías usar: createContext({});

export const useTaskboardContext = () => {
  const context = useContext(TaskboardContext);
  if (!context) {
    throw new Error('useTaskboardContext must be used within a TaskboardProvider');
  }
  return context;
};

export const TaskboardProvider = ({ children }) => {
  const taskboard = useTaskboard();

  return (
    <TaskboardContext.Provider value={taskboard}>
      {children}
    </TaskboardContext.Provider>
  );
};
