import { Card, Dropdown, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, ExportOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import type { Creation } from '@/types';

interface Props {
  creation: Creation;
  onClick?: (creation: Creation) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
}

const typeLabels: Record<string, { label: string; emoji: string }> = {
  website: { label: '网站', emoji: '🌐' },
  app: { label: 'App', emoji: '📱' },
  miniapp: { label: '小程序', emoji: '💚' },
  extension: { label: '插件', emoji: '🔌' },
  landing: { label: '落地页', emoji: '🚀' },
};

const statusColors: Record<string, string> = {
  designing: 'blue',
  developing: 'processing',
  preview: 'warning',
  published: 'success',
};

const statusLabels: Record<string, string> = {
  designing: '设计中',
  developing: '开发中',
  preview: '可预览',
  published: '已发布',
};

export default function CreationCard({ creation, onClick, onDelete, onPublish }: Props) {
  const typeInfo = typeLabels[creation.type] || { label: creation.type, emoji: '📦' };

  const menuItems = [
    { key: 'edit', icon: <EditOutlined />, label: '编辑', onClick: () => onClick?.(creation) },
    { key: 'preview', icon: <EyeOutlined />, label: '预览', onClick: () => onClick?.(creation) },
    { key: 'publish', icon: <ExportOutlined />, label: '发布', onClick: () => onPublish?.(creation.id) },
    { type: 'divider' as const },
    { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, onClick: () => onDelete?.(creation.id) },
  ];

  return (
    <Card
      hoverable
      onClick={() => onClick?.(creation)}
      className="creation-card"
      bodyStyle={{ padding: 0 }}
    >
      <div className="creation-card-thumb">
        {creation.thumbnail ? (
          <img src={creation.thumbnail} alt="" />
        ) : (
          <span>{typeInfo.emoji}</span>
        )}
        <Tag color={statusColors[creation.status]} className="creation-card-status">
          {statusLabels[creation.status]}
        </Tag>
      </div>

      <div className="creation-card-body">
        <div className="creation-card-main">
          <div>
            <h4>{creation.name}</h4>
            <p>
              {creation.description.slice(0, 40)}
              {creation.description.length > 40 ? '...' : ''}
            </p>
          </div>
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <MoreOutlined className="creation-card-more" onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        </div>
        <div className="creation-card-meta">
          <Tag>{typeInfo.label}</Tag>
          <span>{new Date(creation.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Card>
  );
}
