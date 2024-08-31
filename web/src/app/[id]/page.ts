import { redirect } from 'next/navigation';

export default function DynamicPage({ params }: { params: any }) {
  const { id } = params;

  redirect(`/${id}/`);
}
