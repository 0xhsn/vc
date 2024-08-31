import { redirect } from 'next/navigation';

export async function getServerSideProps(context: { params: { id: any; }; }) {
  const { id } = context.params;

  return {
    redirect: {
      destination: `/${id}/index.html`,
      permanent: false, // Use a temporary redirect
    },
  };
}

export default function DynamicPage() {
  // This component won't be rendered because of the redirect
  return null;
}
