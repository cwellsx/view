import React from 'react';

import { ErrorMessage } from '../components';

export function notFound(pathname: string, error?: string) {
  return (
    <div>
      <h3>Not Found</h3>
      <p>
        No page found for <code>{pathname}</code>
      </p>
      <ErrorMessage errorMessage={error} />
    </div>
  );
}
