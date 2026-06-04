import { Card, List, Tag, Button, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { DownloadOutlined, BookOutlined } from '@ant-design/icons';
import { artifactApi } from '@/api/artifactApi';
import { useProjectStore } from '@/stores/projectStore';

const artifactTypeLabels: Record<string, string> = {
  PRD: '需求文档', UI_DESIGN: 'UI设计', TECH_DESIGN: '技术方案',
  TEST_PLAN: '测试方案', CODE_FRONTEND: '前端代码',
  CODE_BACKEND: '后端代码', TEST_REPORT: '测试报告',
  FIX_PATCH: '修复补丁', ACCEPTANCE: '验收报告',
};

const artifactColors: Record<string, string> = {
  PRD: 'blue', UI_DESIGN: 'purple', TECH_DESIGN: 'cyan',
  TEST_PLAN: 'orange', CODE_FRONTEND: 'green',
  CODE_BACKEND: 'green', TEST_REPORT: 'gold',
  FIX_PATCH: 'red', ACCEPTANCE: 'success',
};

export default function ProjectArtifacts() {
  const { currentProject } = useProjectStore();
  const { data: artifacts, isLoading } = useQuery({
    queryKey: ['artifacts', currentProject?.id],
    queryFn: () => artifactApi.getArtifacts(currentProject!.id),
    enabled: !!currentProject,
  });

  if (!artifacts || artifacts.length === 0) {
    return <Card title="产物中心"><Empty description="暂无产物" /></Card>;
  }

  return (
    <Card title="产物中心" loading={isLoading}>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={artifacts}
        renderItem={(artifact: any) => (
          <List.Item>
            <Card
              size="small"
              title={artifact.name}
              extra={<Tag color={artifactColors[artifact.type]}>{artifactTypeLabels[artifact.type]}</Tag>}
              actions={[
                <Button type="link" icon={<BookOutlined />} size="small">预览</Button>,
                <Button type="link" icon={<DownloadOutlined />} size="small">下载</Button>,
              ]}
            >
              <p style={{ color: '#666', fontSize: 12 }}>阶段: {artifact.stage}</p>
              <p style={{ color: '#666', fontSize: 12 }}>版本: v{artifact.version}</p>
              <p style={{ color: '#999', fontSize: 12 }}>{new Date(artifact.createdAt).toLocaleString()}</p>
            </Card>
          </List.Item>
        )}
      />
    </Card>
  );
}
