import { Routes, Route, Navigate } from 'react-router-dom';
import { getUser } from './utils/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Schedule from './pages/Schedule';
import TimeClock from './pages/TimeClock';
import ChangeOrders from './pages/ChangeOrders';
import Messages from './pages/Messages';
import Clients from './pages/Clients';
import Team from './pages/Team';
import AskAI from './pages/AskAI';
import Activity from './pages/Activity';
import ServiceCalls from './pages/ServiceCalls';
import Expenses from './pages/Expenses';
import Support from './pages/Support';

const P = ({ children }) => getUser() ? children : <Navigate to="/login" replace />;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<P><Layout /></P>}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="time" element={<TimeClock />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="change-orders" element={<ChangeOrders />} />
        <Route path="service-calls" element={<ServiceCalls />} />
        <Route path="messages" element={<Messages />} />
        <Route path="support" element={<Support />} />
        <Route path="clients" element={<Clients />} />
        <Route path="team" element={<Team />} />
        <Route path="ask" element={<AskAI />} />
        <Route path="activity" element={<Activity />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
