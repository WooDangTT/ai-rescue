import Link from "next/link";
import { User } from "@/lib/db";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <nav className="navbar">
      <Link href="/" className="nav-brand">
        <span className="logo-icon">R</span>
        AI RESCUE
      </Link>
      <div className="nav-actions">
        {user ? (
          <>
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              Dashboard
            </Link>
            <Link href="/pricing" className="btn btn-ghost btn-sm">
              Pricing
            </Link>
            <div className="nav-user">
              <span>{user.name}</span>
              <span className={`tag tag-${user.plan}`}>
                {user.plan.toUpperCase()}
              </span>
              <Link href="/api/auth/logout" className="btn btn-ghost btn-sm">
                Logout
              </Link>
            </div>
          </>
        ) : (
          <>
            <Link href="/pricing" className="btn btn-ghost btn-sm">
              Pricing
            </Link>
            <Link href="/api/auth/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
