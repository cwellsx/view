import React from 'react';

import { Login as LoginForm } from '../forms';
import { Layout } from '../layouts';

export function showLogin(): Layout {
  const content = <LoginForm />;
  return { main: { content, title: "Login" }, width: "Open" };
}
