import { useMemo, useState } from 'react';
import { Button, Empty, FloatButton, Input, Segmented, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import CreationCard from '@/components/CreationCard';
import { creationApi } from '@/api/creationApi';
import type { Creation } from '@/types';

const fallbackCreations: Creation[] = [
  {
    id: 'mock-id',
    name: '宠物社交平台',
    description: '一个可以分享宠物照片和视频的社交平台',
    type: 'app',
    status: 'developing',
    figmaUrl: '',
    thumbnail: '',
    messages: [],
    createdAt: '2026-06-01',
    updatedAt: '2026-06-04',
    code: '<div style="padding:20px"><h1>宠物社交平台</h1><p>欢迎来到宠物社交!</p></div>',
  },
  {
    id: 'portfolio-dark',
    name: '个人作品集',
    description: '暗黑风格的个人作品集网站',
    type: 'website',
    status: 'preview',
    figmaUrl: 'https://www.figma.com/file/ABC123',
    thumbnail: '',
    messages: [],
    createdAt: '2026-06-02',
    updatedAt: '2026-06-03',
    code: '<div style="background:#1a1a1a;color:#fff;padding:40px"><h1>我的作品集</h1></div>',
  },
  {
    id: 'coffee-landing',
    name: '手工咖啡电商',
    description: '手工咖啡品牌的电商落地页',
    type: 'landing',
    status: 'published',
    previewUrl: 'https://preview.example.com/3',
    thumbnail: '',
    messages: [],
    createdAt: '2026-05-28',
    updatedAt: '2026-06-01',
    code: '<div style="padding:20px"><h1>手工咖啡</h1><button>立即购买</button></div>',
  },
  {
    id: 'translate-extension',
    name: '翻译助手插件',
    description: 'Chrome 扩展，翻译网页选中文本',
    type: 'extension',
    status: 'designing',
    figmaUrl: '',
    thumbnail: '',
    messages: [],
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
    code: '',
  },
  {
    id: 'voice-todo',
    name: '语音待办小程序',
    description: '支持语音输入的待办事项小程序',
    type: 'miniapp',
    status: 'developing',
    thumbnail: '',
    messages: [],
    createdAt: '2026-06-03',
    updatedAt: '2026-06-04',
    code: '<div style="padding:20px"><h1>待办事项</h1><input placeholder="说点什么..."/></div>',
  },
];

const segments = ['全部', 'website', 'app', 'landing', 'designing', 'developing', 'published'];

export default function CreativeIsland() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPrompt = typeof location.state === 'object' && location.state && 'prompt' in location.state
    ? String(location.state.prompt)
    : '';
  const [filter, setFilter] = useState('全部');
  const [search, setSearch] = useState(initialPrompt);

  const { data, refetch } = useQuery({
    queryKey: ['creations'],
    queryFn: () => creationApi.getCreations(),
    retry: false,
  });

  const creations = data && data.length > 0 ? data : fallbackCreations;

  const filtered = useMemo(() => {
    return creations.filter((creation) => {
      if (filter !== '全部' && creation.type !== filter && creation.status !== filter) return false;
      if (search && !creation.name.includes(search) && !creation.description.includes(search)) return false;
      return true;
    });
  }, [creations, filter, search]);

  const handleCreate = async () => {
    if (!search.trim()) {
      navigate('/v2');
      return;
    }

    try {
      const creation = await creationApi.createFromPrompt(search.trim(), 'website');
      message.success('产物已创建');
      navigate(`/studio/${creation.id}`);
      await refetch();
    } catch {
      message.info('当前使用演示数据打开工作室');
      navigate('/studio/mock-id');
    }
  };

  return (
    <div className="creation-island">
      <header className="creation-island-header">
        <div>
          <h2>🏝️ 造物岛</h2>
          <p>你的创意空间，{creations.length} 个产物</p>
        </div>
        <div className="creation-island-actions">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索产物..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建
          </Button>
        </div>
      </header>

      <Segmented options={segments} value={filter} onChange={(value) => setFilter(String(value))} />

      {filtered.length === 0 ? (
        <Empty description="暂无产物，点击右下角创建" className="creation-empty" />
      ) : (
        <div className="creation-grid">
          {filtered.map((creation) => (
            <CreationCard
              key={creation.id}
              creation={creation}
              onClick={(item) => navigate(`/studio/${item.id}`)}
            />
          ))}
        </div>
      )}

      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        tooltip="创建新产物"
        onClick={handleCreate}
      />
    </div>
  );
}
