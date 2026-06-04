import { Card, Steps, Button, Space, Tag, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi } from '@/api/pipelineApi';
import { useProjectStore } from '@/stores/projectStore';
import StatusBadge from '@/components/StatusBadge';

export default function ProjectPipeline() {
  const { currentProject } = useProjectStore();
  const queryClient = useQueryClient();
  const pipelineId = currentProject?.id || '';

  const { data: nodes, isLoading } = useQuery({
    queryKey: ['nodes', pipelineId],
    queryFn: () => pipelineApi.getNodes(pipelineId),
    enabled: !!pipelineId,
  });

  const retryMutation = useMutation({
    mutationFn: ({ pid, nid }: { pid: string; nid: string }) => pipelineApi.retryNode(pid, nid),
    onSuccess: () => { message.success('重试成功'); queryClient.invalidateQueries({ queryKey: ['nodes'] }); },
  });

  if (!currentProject) return null;

  const nodeList = (nodes || []) as any[];
  const currentStep = nodeList.findIndex((n: any) => n.status === 'RUNNING' || n.status === 'WAITING');

  return (
    <Card title="流程进度" loading={isLoading}>
      {nodeList.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>暂无流程数据</p>
      ) : (
        <>
          <Steps
            direction="vertical"
            current={currentStep >= 0 ? currentStep : nodeList.length}
            items={nodeList.map((node: any) => ({
              title: node.name,
              description: (
                <Space direction="vertical" size="small" style={{ marginTop: 4 }}>
                  <StatusBadge status={node.status} />
                  {node.logs && <pre style={{ fontSize: 12, color: '#666', maxHeight: 120, overflow: 'auto' }}>{node.logs}</pre>}
                  {node.status === 'FAILED' && (
                    <Space>
                      <Button size="small" type="primary" onClick={() => retryMutation.mutate({ pid: pipelineId, nid: node.id })}>重试</Button>
                      <Button size="small">跳过</Button>
                    </Space>
                  )}
                </Space>
              ),
            }))}
          />
        </>
      )}
    </Card>
  );
}
