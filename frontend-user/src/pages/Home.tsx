import { Row, Col, Card, Statistic, List, Button, Space } from 'antd';
import { AppstoreOutlined, CheckCircleOutlined, ClockCircleOutlined, PlayCircleOutlined, ProjectOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/api/projectApi';
import ProjectCard from '@/components/ProjectCard';

export default function Home() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects({ pageSize: 10 }),
  });

  const projects = data?.items || [];
  const running = projects.filter(p => p.status === 'RUNNING');
  const recent = projects.slice(0, 5);

  return (
    <div>
      <Card className="home-v2-banner" style={{ marginBottom: 24 }}>
        <div>
          <h2>用一句话，创造你的产品</h2>
          <p>V2 造物岛创作平台已恢复，可以从创意产物网格进入实时预览和 AI 工作室。</p>
        </div>
        <Space>
          <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/v2')}>查看 V2 首页</Button>
          <Button type="primary" icon={<AppstoreOutlined />} onClick={() => navigate('/island')}>进入造物岛</Button>
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="项目总数" value={projects.length} prefix={<ProjectOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="运行中" value={running.length} prefix={<PlayCircleOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="待处理" value={projects.filter(p => p.status === 'PENDING_ACCEPTANCE').length} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="已完成" value={projects.filter(p => p.status === 'COMPLETED' || p.status === 'ACCEPTED').length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Card
        title="最近项目"
        extra={<Button type="primary" onClick={() => navigate('/projects/new')}>创建项目</Button>}
      >
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={recent}
          renderItem={(project) => (
            <List.Item><ProjectCard project={project} /></List.Item>
          )}
        />
      </Card>
    </div>
  );
}
