import Form from '@/app/ui/themes/create-form';
import Breadcrumbs from '@/app/ui/themes/breadcrumbs';
 
export default async function Page() {
 
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Themes', href: '/dashboard/themes' },
          {
            label: 'Create Theme',
            href: '/dashboard/themes/create',
            active: true,
          },
        ]}
      />
      <Form />
    </main>
  );
}