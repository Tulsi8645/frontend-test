import SuperAdminLayout from './SuperAdminLayout';

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
}
