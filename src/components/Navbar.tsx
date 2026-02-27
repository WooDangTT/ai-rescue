import Link from "next/link";
import { User } from "@/lib/db";
import BetaBadge from "@/components/BetaBadge";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <nav className="navbar" data-testid="navbar">
      <Link href="/" className="nav-brand" data-testid="navBrand">
        <span className="logo-icon">R</span>
        AI RESCUE
        <BetaBadge />
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
              {user.picture && (
                <img
                  src={user.picture}
                  alt=""
                  width={24}
                  height={24}
                  style={{ borderRadius: "50%" }}
                  referrerPolicy="no-referrer"
                />
              )}
              <span>{user.name}</span>
              <span className={`tag tag-${user.plan}`}>
                {user.plan.toUpperCase()}
              </span>
              <a href="/api/auth/logout" className="btn btn-ghost btn-sm">
                Logout
              </a>
            </div>
          </>
        ) : (
          <>
            <Link href="/pricing" className="btn btn-ghost btn-sm">
              Pricing
            </Link>
            <a href="/api/auth/login" className="btn btn-primary btn-sm">
              Sign In
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
