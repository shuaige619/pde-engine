import { Card, Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Project } from '@/types';
import StatusBadge from './StatusBadge';

interface Props { project: Project; }

const platformLabels: Record<string, string> = {
  WEB: 'Web', APP: 'App', UNIAPP: 'uni-app',
  CHROME_EXTENSION: 'Chrome扩展', BACKEND_API: '后端API',
};

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      onClick={() => navigate(`/projects/${project.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: '0 0 8px' }}>{project.name}</h4>
          <p style={{ color: '#666', fontSize: 13, margin: '0 0 12px' }}>{project.description}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Tag>{platformLabels[project.platform]}</Tag>
        <Tag>{project.codeSource === 'TEMPLATE' ? '平台模板' : 'Git仓库'}</Tag>
      </div>
      {project.status === 'RUNNING' && (
        <Progress percent={Math.round(project.progress)} size="small" status="active" />
      )}
    </Card>
  );
}
