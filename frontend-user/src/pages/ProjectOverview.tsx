import { Card, Timeline, Progress, Row, Col, Statistic } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/api/projectApi';
import { useProjectStore } from '@/stores/projectStore';

const stageNames = [
  '产品创意', '产品设计', 'UI设计', '技术方案', '测试方案',
  '整体评审', '设计上下文', '代码生成', '代码交付',
  '测试验证', '修复回归', '验收',
];

export default function ProjectOverview() {
  const { currentProject } = useProjectStore();
  const { data: pipeline } = useQuery({
    queryKey: ['pipeline', currentProject?.id],
    queryFn: () => projectApi.getPipeline(currentProject!.id),
    enabled: !!currentProject,
  });

  if (!currentProject) return null;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card><Statistic title="当前阶段" value={currentProject.currentStage || '未开始'} /></Card></Col>
        <Col span={8}><Card><Statistic title="整体进度" value={`${Math.round(currentProject.progress)}%`} /></Card></Col>
        <Col span={8}><Card><Statistic title="产物数量" value={(pipeline as any)?.artifacts || 0} /></Card></Col>
      </Row>
      <Card title="流程阶段">
        {currentProject.status === 'DRAFT' ? (
          <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>项目尚未启动，点击"启动流程"开始</p>
        ) : (
          <>
            <Progress percent={Math.round(currentProject.progress)} status="active" style={{ marginBottom: 24 }} />
            <Timeline
              mode="left"
              items={stageNames.map((name, i) => ({
                label: `阶段 ${i + 1}`,
                children: name,
                color: i < Math.floor(currentProject.progress / 8.3) ? 'green' : 'gray',
              }))}
            />
          </>
        )}
      </Card>
    </div>
  );
}
