import { useMemo } from 'react';

interface Props {
  figmaUrl?: string;
  fileKey?: string;
  height?: string;
}

function extractFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export default function FigmaPreview({ figmaUrl, fileKey, height = '100%' }: Props) {
  const embedUrl = useMemo(() => {
    const key = fileKey || (figmaUrl ? extractFileKey(figmaUrl) : null);
    if (!key) return null;
    return `https://www.figma.com/embed?embed_host=pde-engine&url=https://www.figma.com/file/${key}`;
  }, [figmaUrl, fileKey]);

  if (!embedUrl) {
    return (
      <div className="figma-empty" style={{ height }}>
        <span>🎨</span>
        <p>暂无设计稿</p>
        <small>在下方输入 Figma 链接以关联设计</small>
      </div>
    );
  }

  return (
    <iframe
      src={embedUrl}
      className="figma-frame"
      style={{ height }}
      allowFullScreen
      title="Figma Design"
    />
  );
}
