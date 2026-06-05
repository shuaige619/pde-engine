import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Segmented, Tabs, message } from 'antd';
import {
  ArrowLeftOutlined,
  CodeOutlined,
  DesktopOutlined,
  FullscreenOutlined,
  MobileOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  TabletOutlined,
} from '@ant-design/icons';
import AIPanel from '@/components/AIPanel';
import FigmaPreview from '@/components/FigmaPreview';
import LivePreview from '@/components/LivePreview';
import { creationApi } from '@/api/creationApi';
import type { ChatMessage, Creation } from '@/types';

const demoCreation: Creation = {
  id: 'mock-id',
  name: '宠物社交平台',
  description: '宠物照片分享社交平台',
  type: 'app',
  status: 'developing',
  figmaUrl: '',
  code: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>宠物社交平台</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f5f5f5}
.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:40px 20px;text-align:center}
.header h1{font-size:28px;margin-bottom:8px}
.header p{opacity:.9}
.nav{display:flex;justify-content:center;gap:20px;padding:16px;background:white;border-bottom:1px solid #eee}
.nav a{color:#666;text-decoration:none;font-size:14px}
.content{max-width:800px;margin:20px auto;padding:0 16px}
.card{background:white;border-radius:16px;padding:24px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.card h3{color:#333;margin-bottom:8px}
.card p{color:#666;font-size:14px;line-height:1.6}
.btn{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:0;padding:12px 32px;border-radius:24px;font-size:16px;cursor:pointer;margin-top:12px}
.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
.gallery-item{aspect-ratio:1;background:#e8e8e8;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px}
.footer{text-align:center;padding:40px 20px;color:#999;font-size:13px}
</style>
</head>
<body>
<div class="header"><h1>宠物社交平台</h1><p>分享你和毛孩子的每一个美好瞬间</p></div>
<div class="nav"><a href="#">首页</a><a href="#">发现</a><a href="#">发布</a><a href="#">消息</a><a href="#">我的</a></div>
<div class="content">
<div class="card"><h3>最新动态</h3><p>看看别人家的宠物都在做什么</p><div class="gallery"><div class="gallery-item">猫</div><div class="gallery-item">狗</div><div class="gallery-item">兔</div><div class="gallery-item">狐</div><div class="gallery-item">熊</div><div class="gallery-item">考</div></div></div>
<div class="card"><h3>热门话题</h3><p>#萌宠日常 #宠物穿搭 #养猫经验 #狗狗训练</p><button class="btn">发布动态</button></div>
</div>
<div class="footer">2026 宠物社交平台 - 用 AI 创造</div>
</body>
</html>`,
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: '你好！我已经根据你的描述生成了宠物社交平台的初始版本。\n\n你可以告诉我想要修改的地方，我会实时更新预览。',
      createdAt: '2026-06-04T10:00:00',
    },
  ],
  createdAt: '2026-06-04',
  updatedAt: '2026-06-04',
};

const demoCreations: Record<string, Creation> = {
  'mock-id': demoCreation,
  'portfolio-dark': {
    ...demoCreation,
    id: 'portfolio-dark',
    name: '个人作品集',
    description: '暗黑风格的个人作品集网站',
    type: 'website',
    status: 'preview',
    code: '<div style="background:#111;color:#fff;min-height:100vh;padding:56px;font-family:sans-serif"><h1>我的作品集</h1><p>设计、代码和产品都在这里。</p></div>',
  },
  'coffee-landing': {
    ...demoCreation,
    id: 'coffee-landing',
    name: '手工咖啡电商',
    description: '手工咖啡品牌的电商落地页',
    type: 'landing',
    status: 'published',
    code: '<div style="padding:48px;font-family:sans-serif"><h1>手工咖啡</h1><p>新鲜烘焙，今天送达。</p><button style="padding:12px 24px">立即购买</button></div>',
  },
};

export default function Studio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [creation, setCreation] = useState<Creation | null>(null);
  const [aiVisible, setAiVisible] = useState(true);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('preview');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCreation() {
      if (!id) return;
      const fallback = demoCreations[id] || demoCreation;

      try {
        const remote = await creationApi.getCreation(id);
        if (!mounted) return;
        setCreation(remote);
        setCode(remote.code || fallback.code || '');
        setFigmaUrl(remote.figmaUrl || '');
        setMessages(remote.messages || []);
      } catch {
        if (!mounted) return;
        setCreation(fallback);
        setCode(fallback.code || '');
        setFigmaUrl(fallback.figmaUrl || '');
        setMessages(fallback.messages || []);
      }
    }

    loadCreation();
    return () => { mounted = false; };
  }, [id]);

  const handleSendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsAILoading(true);

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `已处理你的需求：“${content}”\n\n我已更新了代码预览。主要变更：\n- 调整了样式细节\n- 优化了布局结构\n\n你可以在右侧预览区查看效果。`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsAILoading(false);
    }, 1200);
  }, []);

  const deviceWidth = { desktop: '100%', tablet: '768px', mobile: '375px' };

  if (!creation) {
    return (
      <div className="studio-missing">
        <p>产物加载中...</p>
        <Button onClick={() => navigate('/island')}>返回造物岛</Button>
      </div>
    );
  }

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <div className="studio-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/island')} />
          <span>{creation.name}</span>
          <small>{creation.status === 'developing' ? '开发中' : creation.status}</small>
        </div>
        <div className="studio-actions">
          <Segmented
            value={device}
            onChange={(value) => setDevice(value as 'desktop' | 'tablet' | 'mobile')}
            options={[
              { value: 'desktop', icon: <DesktopOutlined /> },
              { value: 'tablet', icon: <TabletOutlined /> },
              { value: 'mobile', icon: <MobileOutlined /> },
            ]}
            size="small"
          />
          <Button
            type={aiVisible ? 'primary' : 'default'}
            icon={<RobotOutlined />}
            onClick={() => setAiVisible(!aiVisible)}
            size="small"
          >
            AI 助手
          </Button>
          <Button type="primary" icon={<PlayCircleOutlined />} size="small">发布</Button>
        </div>
      </header>

      <main className="studio-main">
        <section className="studio-workspace">
          <div className="studio-tabs">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                { key: 'design', label: <span><PictureOutlined /> 设计稿</span> },
                { key: 'preview', label: <span><FullscreenOutlined /> 实时预览</span> },
                { key: 'code', label: <span><CodeOutlined /> 代码</span> },
              ]}
            />
          </div>

          <div className="studio-content">
            {activeTab === 'design' && (
              <div className="studio-design-empty">
                {!figmaUrl ? (
                  <>
                    <span>🎨</span>
                    <p>暂无 Figma 设计稿</p>
                    <Input
                      placeholder="粘贴 Figma 链接..."
                      value={figmaUrl}
                      onChange={(e) => setFigmaUrl(e.target.value)}
                      onPressEnter={() => message.success('Figma 已关联')}
                    />
                    <small>或在 AI 面板中说“帮我生成一个设计方案”</small>
                  </>
                ) : (
                  <FigmaPreview figmaUrl={figmaUrl} height="100%" />
                )}
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="studio-preview-wrap">
                <div style={{ width: deviceWidth[device] }}>
                  <LivePreview code={code} height="100%" />
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="studio-code">
                <div className="studio-code-actions">
                  <Button size="small" onClick={() => { navigator.clipboard.writeText(code); message.success('已复制'); }}>
                    复制
                  </Button>
                  <Button type="primary" size="small" onClick={() => message.success('代码已保存')}>保存</Button>
                </div>
                <pre><code>{code}</code></pre>
              </div>
            )}
          </div>
        </section>

        <AIPanel
          messages={messages}
          onSend={handleSendMessage}
          isLoading={isAILoading}
          visible={aiVisible}
          onClose={() => setAiVisible(false)}
        />
      </main>
    </div>
  );
}
