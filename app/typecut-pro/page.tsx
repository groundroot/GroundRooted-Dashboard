import { redirect } from 'next/navigation';
import { appCatalog } from '@/products/catalog';

export default function Page() {
  redirect(appCatalog.find(app => app.id === 'typecut-pro')!.href);
}
