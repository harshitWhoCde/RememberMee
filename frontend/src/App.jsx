import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LivingRoom from './pages/LivingRoom';
import VisitorArchive from './pages/VisitorArchive';
import VoiceAsk from './pages/VoiceAsk';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<LivingRoom />} />
        <Route path="visitors" element={<VisitorArchive />} />
        <Route path="voice" element={<VoiceAsk />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
