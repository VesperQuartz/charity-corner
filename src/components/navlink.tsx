"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

type NavLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  exact?: boolean;
  className?: string | ((state: { isActive: boolean }) => string);
};

const NavLink = ({
  href,
  exact = false,
  className,
  children,
  ...rest
}: NavLinkProps) => {
  const pathname = usePathname();
  const hrefString = href.toString();

  const isActive = exact
    ? pathname === hrefString
    : pathname === hrefString || pathname.startsWith(`${hrefString}/`);

  const resolvedClassName =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link
      href={href}
      className={resolvedClassName}
      aria-current={isActive ? "page" : undefined}
      {...rest}
    >
      {children}
    </Link>
  );
};

export default NavLink;
