import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Steps, Form, Input, Select, Button, Card, Radio, message } from 'antd';
import { projectApi } from '@/api/projectApi';
import type { CreateProjectInput } from '@/types';

const { TextArea } = Input;
const platformOptions = [
  { value: 'WEB', label: 'Web' },
  { value: 'APP', label: 'App' },
  { value: 'UNIAPP', label: 'uni-app' },
  { value: 'CHROME_EXTENSION', label: 'Chrome扩展' },
  { value: 'BACKEND_API', label: '后端API' },
];

export default function ProjectNew() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateProjectInput>>({});

  const steps = [
    { title: '产品信息', content: (
      <>
        <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
          <Input placeholder="输入项目名称" />
        </Form.Item>
        <Form.Item name="description" label="项目描述">
          <TextArea rows={4} placeholder="描述你的项目..." />
        </Form.Item>
      </>
    )},
    { title: '目标平台', content: (
      <Form.Item name="platform" label="目标平台" rules={[{ required: true }]}>
        <Select placeholder="选择平台" options={platformOptions} />
      </Form.Item>
    )},
    { title: '代码来源', content: (
      <Form.Item name="codeSource" label="代码来源" rules={[{ required: true }]} initialValue="TEMPLATE">
        <Radio.Group>
          <Radio.Button value="TEMPLATE">使用平台模板</Radio.Button>
          <Radio.Button value="GIT">连接Git仓库</Radio.Button>
        </Radio.Group>
      </Form.Item>
    )},
    { title: '设计来源', content: (
      <Form.Item name="figmaUrl" label="Figma链接">
        <Input placeholder="可选：绑定Figma设计文件" />
      </Form.Item>
    )},
    { title: '测试方式', content: (
      <Form.Item name="testMode" label="测试方式" initialValue="LOCAL">
        <Radio.Group>
          <Radio.Button value="LOCAL">本地测试脚本</Radio.Button>
          <Radio.Button value="BROWSER">平台浏览器测试</Radio.Button>
          <Radio.Button value="UPLOAD">上传测试报告</Radio.Button>
        </Radio.Group>
      </Form.Item>
    )},
    { title: '确认', content: (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <h3>确认创建项目</h3>
        <p>点击"启动"将开始AI研发流程</p>
      </div>
    )},
  ];

  const handleNext = async () => {
    if (current < steps.length - 1) {
      try {
        await form.validateFields();
        setFormData((prev) => ({ ...prev, ...form.getFieldsValue(true) }));
        setCurrent(current + 1);
      } catch { /* validation failed */ }
    } else {
      setLoading(true);
      try {
        const values = { ...formData, ...form.getFieldsValue(true) };
        const data: CreateProjectInput = {
          name: values.name!,
          description: values.description,
          platform: values.platform!,
          codeSource: values.codeSource || 'TEMPLATE',
          gitUrl: values.gitUrl,
          figmaUrl: values.figmaUrl,
          testMode: values.testMode,
        };
        const project = await projectApi.createProject(data);
        await projectApi.startPipeline(project.id);
        message.success('项目创建成功');
        navigate(`/projects/${project.id}`);
      } catch {
        message.error('创建失败');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Card title="创建新项目">
      <Steps current={current} items={steps.map(s => ({ title: s.title }))} style={{ marginBottom: 32 }} />
      <Form form={form} layout="vertical">
        {steps[current].content}
      </Form>
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {current > 0 && <Button onClick={() => setCurrent(current - 1)}>上一步</Button>}
        <Button type="primary" onClick={handleNext} loading={loading}>
          {current === steps.length - 1 ? '启动项目' : '下一步'}
        </Button>
      </div>
    </Card>
  );
}
