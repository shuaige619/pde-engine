import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Input, Row } from 'antd';
import { CodeOutlined, FileImageOutlined, RocketOutlined, ThunderboltOutlined } from '@ant-design/icons';

const examples = [
  '我想做一个宠物社交 App，可以分享宠物照片和视频',
  '帮我生成一个个人作品集网站，要有暗黑风格',
  '做一个电商落地页，卖手工咖啡',
  '创建一个 Chrome 插件，可以翻译网页选中的文本',
  '做一个待办事项小程序，支持语音输入',
];

const features = [
  { icon: <ThunderboltOutlined />, title: '一句话启动', desc: '用自然语言描述你的想法，AI 自动完成设计和开发' },
  { icon: <FileImageOutlined />, title: 'Figma 实时渲染', desc: '关联 Figma 设计稿，在平台内实时预览和编辑' },
  { icon: <CodeOutlined />, title: '实时调试', desc: '代码和预览同步更新，修改即时生效' },
  { icon: <RocketOutlined />, title: '一键发布', desc: '完成后直接部署上线，获得可分享的链接' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');

  const handleCreate = () => {
    navigate('/island', { state: prompt.trim() ? { prompt: prompt.trim() } : undefined });
  };

  return (
    <div className="v2-landing">
      <section className="v2-hero">
        <h1>用一句话，创造你的产品</h1>
        <p>描述你的想法，AI 负责设计、开发、部署。你的造物岛，从这里开始。</p>

        <div className="v2-prompt-box">
          <Input.TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想做的产品，例如：我想做一个宠物社交 App..."
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
          <Button type="primary" size="large" onClick={handleCreate}>
            开始创造
          </Button>
        </div>

        <div className="v2-example-list">
          {examples.map((example) => (
            <Button key={example} type="dashed" size="small" onClick={() => setPrompt(example)}>
              {example.slice(0, 20)}...
            </Button>
          ))}
        </div>
      </section>

      <section className="v2-features">
        <Row gutter={[24, 24]}>
          {features.map((feature) => (
            <Col xs={24} sm={12} lg={6} key={feature.title}>
              <Card className="v2-feature-card">
                <div className="v2-feature-icon">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.desc}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="v2-cta">
        <h2>准备好开始了吗？</h2>
        <p>加入造物岛，用 AI 把你的想法变成现实</p>
        <Button type="primary" size="large" onClick={() => navigate('/island')}>
          进入造物岛
        </Button>
      </section>
    </div>
  );
}
