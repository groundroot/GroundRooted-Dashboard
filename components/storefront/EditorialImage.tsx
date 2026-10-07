import { editorialBase, editorialImages, type EditorialImageName } from '@/products/editorial-media';

export default function EditorialImage({ name, priority = false, sizes = '(max-width: 767px) 100vw, 50vw' }: {
  name: EditorialImageName;
  priority?: boolean;
  sizes?: string;
}) {
  const asset = editorialImages[name];
  return <img className="gr-editorial-image" src={`${editorialBase}/${asset.stem}-1440.webp`}
    srcSet={`${editorialBase}/${asset.stem}-640.webp 640w, ${editorialBase}/${asset.stem}-1440.webp 1440w`}
    sizes={sizes} width={1440} height={960} alt={asset.alt}
    loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />;
}
