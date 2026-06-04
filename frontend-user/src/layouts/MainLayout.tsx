import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { HomeOutlined, ProjectOutlined, SettingOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';

const { Sider, Header, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/projects', icon: <ProjectOutlined />, label: '项目列表' },
    { key: '/profile', icon: <SettingOutlined />, label: '个人设置' },
  ];

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人资料', onClick: () => navigate('/profile') },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: logout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
          PDE Engine
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname === '/' ? '/' : location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.name || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
