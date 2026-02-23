"use client";
import {
  Activity as ActivityIcon,
  BarChart3,
  History,
  LogOut,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/loading";
import NavLink from "@/components/navlink";
import { AuthProvider } from "@/context/AuthContext";
import { StoreProvider } from "@/context/StoreContext";
import { authClient } from "@/lib/auth-client";

const SidebarLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => (
  <NavLink
    href={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        isActive
          ? "bg-pink-600 text-white shadow-md"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      }`
    }
  >
    {icon}
    <span className="font-medium">{label}</span>
  </NavLink>
);

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useRouter();
  const auth = authClient.useSession();
  if (auth.isPending) return <PageLoader />;

  const isAdmin = auth.data?.user.role === "admin";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="z-10 flex w-64 flex-col bg-gray-900 text-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-gray-800 p-2">
          <Image
            src="/logo_1.png"
            alt="Charity Corner"
            width={300}
            height={300}
          />
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          <SidebarLink
            to="/pos"
            icon={<ShoppingCart size={20} />}
            label="Point of Sale"
          />

          {isAdmin && (
            <SidebarLink
              to="/vendor"
              icon={<Truck size={20} />}
              label="Vendors"
            />
          )}

          <SidebarLink
            to="/stock"
            icon={<Package size={20} />}
            label="Stock Inventory"
          />
          <SidebarLink
            to="/history"
            icon={<History size={20} />}
            label="Sales History"
          />

          {isAdmin && (
            <>
              <SidebarLink
                to="/analytics"
                icon={<BarChart3 size={20} />}
                label="Analytics"
              />
              <SidebarLink
                to="/user-management"
                icon={<Users size={20} />}
                label="User Access"
              />
              <SidebarLink
                to="/event-log"
                icon={<ActivityIcon size={20} />}
                label="Event Log"
              />
            </>
          )}
        </nav>

        <div className="border-t border-gray-800 p-4 text-center text-xs text-gray-500">
          v1.0.0 &copy; 2024 Charity Corner
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex h-full flex-1 flex-col overflow-hidden">
        <header className="z-0 flex h-16 items-center justify-between bg-white px-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">
                {auth.data?.user?.name}
              </p>
              <p className="flex items-center justify-end gap-1 text-xs text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                {auth.data?.user?.role?.toUpperCase()}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-500 uppercase">
              {auth.data?.user?.name.charAt(0)}
            </div>
            <button
              type="button"
              onClick={() => {
                authClient.signOut();
                navigate.push("/login");
              }}
              className="ml-2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6">{children}</div>
      </main>
    </div>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <AuthProvider>
        <AppLayout>{children}</AppLayout>
      </AuthProvider>
    </StoreProvider>
  );
};

export default DashboardLayout;
