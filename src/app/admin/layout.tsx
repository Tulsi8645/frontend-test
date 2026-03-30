'use client';

import { usePathname } from 'next/navigation';
import AdminLayout from './AdminLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Don't wrap login page with AdminLayout (no sidebar for unauthenticated users)
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }
    
    return <AdminLayout>{children}</AdminLayout>;
}
