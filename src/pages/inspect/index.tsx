'use client';

import { Text } from '@penumbra-zone/ui/Text';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const InspectPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.startsWith('plpid1')) {
      router.push(`/inspect/lp/${searchQuery}`);
    }
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ width: '50%' }}>
          <form onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #333',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                outline: 'none'
              }}
            />
          </form>
        </div>
      </div>
    </section>
  );
};
