import { Badge, Tag } from 'antd';

const statusConfig: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'default', label: '草稿' },
  RUNNING: { color: 'processing', label: '运行中' },
  PAUSED: { color: 'warning', label: '已暂停' },
  FAILED: { color: 'error', label: '失败' },
  COMPLETED: { color: 'success', label: '完成' },
  PENDING: { color: 'default', label: '待开始' },
  WAITING: { color: 'orange', label: '等待中' },
  SKIPPED: { color: 'default', label: '已跳过' },
  WAITING_USER: { color: 'purple', label: '待处理' },
};

interface Props { status: string; type?: 'badge' | 'tag'; }

export default function StatusBadge({ status, type = 'tag' }: Props) {
  const config = statusConfig[status] || { color: 'default', label: status };
  if (type === 'badge') return <Badge status={config.color as any} text={config.label} />;
  return <Tag color={config.color}>{config.label}</Tag>;
}
