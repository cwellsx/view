import React from 'react';

import { useGetLink, useGetNavLink } from '../hooks';

/*
  Link and NavLink are defined here so the rest of the application can avoid depending directly on React Router
  e.g. so that in future  there could be a different implementation of this project which depends on Next.js instead.
*/

export type LinkProps = React.PropsWithChildren<{
  to: string;
  className?: string;
}>;

export type NavLinkProps = React.PropsWithChildren<{
  to: string;
  className?: string;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}>;

export const Link: React.FunctionComponent<LinkProps> = (props: LinkProps) => {
  return useGetLink(props);
};
export const NavLink: React.FunctionComponent<NavLinkProps> = (props: NavLinkProps) => {
  return useGetNavLink(props);
};
