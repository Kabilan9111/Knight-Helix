import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sanchalan_token') : null;
    const host = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
    const newSocket = io(host, {
      auth: {
        token: token
      }
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
