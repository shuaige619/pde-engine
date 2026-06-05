import { useEffect, useRef, useState } from 'react';
import { Avatar, Button, Input, Spin } from 'antd';
import { CloseOutlined, RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import type { ChatMessage } from '@/types';

interface Props {
  messages: ChatMessage[];
  onSend: (content: string) => void;
  isLoading?: boolean;
  visible: boolean;
  onClose: () => void;
}

export default function AIPanel({ messages, onSend, isLoading, visible, onClose }: Props) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  if (!visible) return null;

  return (
    <aside className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <RobotOutlined />
          <span>AI 助手</span>
        </div>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
      </div>

      <div ref={scrollRef} className="ai-panel-messages">
        {messages.length === 0 && (
          <div className="ai-panel-empty">
            <RobotOutlined />
            <p>告诉我你想怎么改</p>
            <span>例如：把按钮改成圆角、添加一个导航栏</span>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-message ai-message-${msg.role}`}>
            <Avatar
              icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              className="ai-message-avatar"
              size="small"
            />
            <div className="ai-message-bubble">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="ai-panel-loading">
            <Spin size="small" />
            <span>AI 思考中...</span>
          </div>
        )}
      </div>

      <div className="ai-panel-input">
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="描述你想要的修改..."
          autoSize={{ minRows: 1, maxRows: 4 }}
        />
        <div className="ai-panel-actions">
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={isLoading} size="small">
            发送
          </Button>
        </div>
      </div>
    </aside>
  );
}
