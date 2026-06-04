import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/layouts/MainLayout';
import ProjectLayout from '@/layouts/ProjectLayout';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import ProjectList from '@/pages/ProjectList';
import ProjectNew from '@/pages/ProjectNew';
import ProjectDetail from '@/pages/ProjectDetail';
import ProjectOverview from '@/pages/ProjectOverview';
import ProjectPipeline from '@/pages/ProjectPipeline';
import ProjectArtifacts from '@/pages/ProjectArtifacts';
import Profile from '@/pages/Profile';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadUser } = useAuthStore();
  useEffect(() => { if (isAuthenticated) loadUser(); }, []);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/projects/new" element={<ProjectNew />} />
              <Route path="/projects/:id" element={<ProjectLayout />}>
                <Route path="overview" element={<ProjectOverview />} />
                <Route path="pipeline" element={<ProjectPipeline />} />
                <Route path="artifacts" element={<ProjectArtifacts />} />
                <Route index element={<Navigate to="overview" replace />} />
              </Route>
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  );
}
