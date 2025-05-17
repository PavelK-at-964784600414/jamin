import Form from '@/app/ui/themes/edit-form';
import Breadcrumbs from '@/app/ui/themes/breadcrumbs';
import { fetchThemeById, fetchMembers } from '@/app/lib/data';
import { notFound } from 'next/navigation';

 
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    // Resolve the params Promise
    const { id } = await params;
    const [theme, members] = await Promise.all([
        fetchThemeById(id),
        fetchMembers(id),
      ]);

      if (!theme) {
        notFound();
      }
    return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Themes', href: '/dashboard/themes' },
          {
            label: 'Edit Theme',
            href: `/dashboard/themes/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form theme={theme} members={members} />
    </main>
  );
}