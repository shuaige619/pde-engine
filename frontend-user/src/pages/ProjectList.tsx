import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Select, Space, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { PlusOutlined } from '@ant-design/icons';
import { projectApi } from '@/api/projectApi';
import type { Project } from '@/types';
import StatusBadge from '@/components/StatusBadge';

const platformLabels: Record<string, string> = {
  WEB: 'Web', APP: 'App', UNIAPP: 'uni-app',
  CHROME_EXTENSION: 'Chrome扩展', BACKEND_API: '后端API',
};

export default function ProjectList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, status],
    queryFn: () => projectApi.getProjects({ search: search || undefined, status: status || undefined }),
  });

  const columns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <StatusBadge status={s} /> },
    { title: '平台', dataIndex: 'platform', key: 'platform', render: (p: string) => <Tag>{platformLabels[p] || p}</Tag> },
    { title: '当前阶段', dataIndex: 'currentStage', key: 'stage', render: (s?: string) => s || '-' },
    { title: '进度', dataIndex: 'progress', key: 'progress', render: (p?: number) => `${Math.round(p ?? 0)}%` },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', render: (d: string) => new Date(d).toLocaleString() },
    { title: '操作', key: 'action', render: (_: unknown, record: Project) => (
      <Button type="link" onClick={() => navigate(`/projects/${record.id}`)}>查看</Button>
    )},
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="搜索项目" onSearch={setSearch} style={{ width: 250 }} allowClear />
        <Select placeholder="状态筛选" allowClear onChange={setStatus} style={{ width: 140 }}
          options={[
            { value: 'DRAFT', label: '草稿' },
            { value: 'RUNNING', label: '运行中' },
            { value: 'PAUSED', label: '已暂停' },
            { value: 'COMPLETED', label: '已完成' },
            { value: 'FAILED', label: '失败' },
          ]}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects/new')}>创建项目</Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items || []}
        loading={isLoading}
        pagination={{ total: data?.total, pageSize: 10 }}
      />
    </div>
  );
}
