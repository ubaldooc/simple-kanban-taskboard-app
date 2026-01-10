import React, { createContext, useContext } from 'react';
import { useTaskboard } from '../hooks/useTaskboard';

const TaskboardContext = createContext(null);

export const useTaskboardContext = () => {
  const context = useContext(TaskboardContext);
  if (!context) {
    throw new Error('useTaskboardContext must be used within a TaskboardProvider');
  }
  return context;
};

export const TaskboardProvider = ({ children }) => {
  const taskboard = useTaskboard();

  // Memoizamos el valor del contexto para que los componentes que lo consumen
  // no se re-rendericen innecesariamente si el objeto 'taskboard' cambia de referencia
  // pero sus valores internos son los mismos (aunque useTaskboard aún no está totalmente optimizado).
  const contextValue = React.useMemo(() => taskboard, [taskboard]);

  return (
    <TaskboardContext.Provider value={contextValue}>
      {children}
    </TaskboardContext.Provider>
  );
};
