'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PagePath } from '@/utils/routes/pages.ts';

const RedirectPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push(PagePath.Trade);
  }, [router]);

  return null;
};

export default RedirectPage;
