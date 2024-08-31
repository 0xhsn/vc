import { redirect } from 'next/navigation';

export default function DynamicPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Perform the redirect
  redirect(`/${id}/index.html`);

  // This return will never be reached because of the redirect, but it's required by TypeScript
  return null;
}
