import { BookOpen, FileText, Play, Scissors } from 'lucide-react';

// Original website symbols, not downloadable app icons or reference-site assets.
export default function AppMark({ product, small = false }: {
  product: 'readymd' | 'youtube-to-md' | 'typecut-pro'; small?: boolean;
}) {
  const Icon = product === 'readymd' ? BookOpen : product === 'youtube-to-md' ? Play : Scissors;
  return <span className={`fx-app-mark fx-mark-${product}${small ? ' fx-mark-small' : ''}`} aria-hidden="true">
    <span className="fx-mark-page"><Icon strokeWidth={1.8} /></span>
    {!small && <span className="fx-mark-corner"><FileText size={18} /></span>}
  </span>;
}
