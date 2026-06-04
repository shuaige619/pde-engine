import { Card, Form, Input, Button, Avatar, Divider, message } from 'antd';
import { UserOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';

export default function Profile() {
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const handleUpdate = async () => {
    message.success('资料已更新');
  };

  return (
    <Card title="个人设置">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar size={80} icon={<UserOutlined />} />
        <h3 style={{ margin: '12px 0 4px' }}>{user?.name || '未设置'}</h3>
        <p style={{ color: '#666' }}>{user?.email}</p>
        <p><SafetyCertificateOutlined /> 角色: {user?.role}</p>
      </div>
      <Divider />
      <Form form={form} layout="vertical" initialValues={{ name: user?.name, email: user?.email }}>
        <Form.Item name="name" label="显示名称"><Input prefix={<UserOutlined />} /></Form.Item>
        <Form.Item name="email" label="邮箱"><Input prefix={<MailOutlined />} disabled /></Form.Item>
        <Form.Item><Button type="primary" onClick={handleUpdate}>保存修改</Button></Form.Item>
      </Form>
    </Card>
  );
}
