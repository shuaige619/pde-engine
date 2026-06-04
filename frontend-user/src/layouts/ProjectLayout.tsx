import { useEffect } from 'react';
import { useParams, Outlet, useNavigate } from 'react-router-dom';
import { Card, Tabs, Button, Tag, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/api/projectApi';
import { useProjectStore } from '@/stores/projectStore';

const tabItems = [
  { key: 'overview', label: '总览' },
  { key: 'pipeline', label: '流程进度' },
  { key: 'artifacts', label: '产物中心' },
];

export default function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCurrentProject } = useProjectStore();

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getProject(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (project) setCurrentProject(project);
  }, [project, setCurrentProject]);

  if (!project) return null;

  const statusColors: Record<string, string> = {
    DRAFT: 'default', RUNNING: 'processing', PAUSED: 'warning',
    FAILED: 'error', COMPLETED: 'success', PENDING_ACCEPTANCE: 'blue',
    ACCEPTED: 'green', ARCHIVED: 'default',
  };

  const statusLabels: Record<string, string> = {
    DRAFT: '草稿', RUNNING: '运行中', PAUSED: '已暂停',
    FAILED: '已失败', COMPLETED: '已完成', PENDING_ACCEPTANCE: '等待验收',
    ACCEPTED: '已验收', ARCHIVED: '已归档',
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>{project.name}</h2>
            <p style={{ color: '#666', margin: '8px 0 0' }}>{project.description}</p>
          </div>
          <Space>
            <Tag color={statusColors[project.status]}>{statusLabels[project.status]}</Tag>
            {project.status === 'DRAFT' && (
              <Button type="primary" onClick={() => projectApi.startPipeline(project.id)}>启动流程</Button>
            )}
            {project.status === 'RUNNING' && (
              <Button onClick={() => projectApi.pausePipeline(project.id)}>暂停</Button>
            )}
          </Space>
        </div>
      </Card>
      <Tabs
        items={tabItems}
        onChange={(key) => navigate(`/projects/${id}/${key}`)}
      />
      <Outlet />
    </div>
  );
}
