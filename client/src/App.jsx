import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { socket } from './socket';

import Auth from './pages/Auth';
import Portal from './pages/Portal';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Squad from './pages/Squad';
import Tactics from './pages/Tactics';
import Market from './pages/Market';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  
  // Active Room state
  const [activeRoom, setActiveRoom] = useState(localStorage.getItem('activeRoom'));
  const [activeManager, setActiveManager] = useState(localStorage.getItem('activeManager'));

  useEffect(() => {
    if (activeRoom && activeManager && token) {
      socket.connect();
      socket.emit('join_room', activeRoom);
    }
    return () => {
      socket.disconnect();
    }
  }, [activeRoom, activeManager, token]);

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleGlobalLogout = () => {
    localStorage.clear(); // Clears everything including room
    setToken(null);
    setUser(null);
    setActiveRoom(null);
    setActiveManager(null);
    socket.disconnect();
  };

  const handleSelectRoom = (roomCode, managerId) => {
    localStorage.setItem('activeRoom', roomCode);
    localStorage.setItem('activeManager', managerId);
    setActiveRoom(roomCode);
    setActiveManager(managerId);
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem('activeRoom');
    localStorage.removeItem('activeManager');
    setActiveRoom(null);
    setActiveManager(null);
    socket.disconnect();
  };

  return (
    <Router>
      <Routes>
        {/* If no token -> Auth */}
        <Route 
          path="/" 
          element={!token ? <Auth onAuthSuccess={handleAuthSuccess} /> : <Navigate to={activeRoom ? "/dashboard" : "/portal"} />} 
        />
        
        {/* Portal: requires token, but no active room */}
        <Route 
          path="/portal" 
          element={
            token ? (
              activeRoom ? <Navigate to="/dashboard" /> : <Portal user={user} token={token} onSelectRoom={handleSelectRoom} onGlobalLogout={handleGlobalLogout} />
            ) : <Navigate to="/" />
          } 
        />
        
        {/* Active game: requires token AND active room */}
        {token && activeRoom ? (
          <Route path="/" element={<DashboardLayout onLogout={handleLeaveRoom} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="plantel" element={<Squad />} />
            <Route path="tactica" element={<Tactics />} />
            <Route path="mercado" element={<Market />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to={token ? "/portal" : "/"} />} />
        )}
      </Routes>
    </Router>
  );
}
