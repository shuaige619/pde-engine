import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';

interface Props {
  code?: string;
  url?: string;
  height?: string;
}

export default function LivePreview({ code, url, height = '100%' }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  // 当code变化时，实时注入到iframe
  useEffect(() => {
    if (!code || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(code);
    doc.close();
    setLoading(false);
  }, [code]);

  // 当url变化时
  useEffect(() => {
    if (url) setLoading(true);
  }, [url]);

  return (
    <div style={{ height, position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#fafafa' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1, background: '#fafafa'
        }}>
          <Spin tip="加载预览..." />
        </div>
      )}
      {url ? (
        <iframe
          ref={iframeRef}
          src={url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          onLoad={() => setLoading(false)}
          title="Live Preview"
        />
      ) : (
        <iframe
          ref={iframeRef}
          style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox="allow-scripts"
          title="Code Preview"
        />
      )}
    </div>
  );
}
