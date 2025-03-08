"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  FileText, 
  CreditCard, 
  Settings, 
  BarChart3, 
  HelpCircle,
  Menu,
  X,
  Globe,
  BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Organizations', href: '/admin/organizations', icon: Globe },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Chatbots', href: '/admin/chatbots', icon: Bot },
  { name: 'Documents', href: '/admin/documents', icon: FileText },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const userInitials = user?.email 
    ? user.email.split('@')[0].substring(0, 2).toUpperCase() 
    : 'AD';

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-slate-900">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 ease-in-out hidden md:flex md:flex-col flex-shrink-0 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800`}
      >
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-between flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-black dark:bg-white flex items-center justify-center rounded-md">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white dark:text-black"
                >
                  <path
                    d="M8 17L12 21M12 21L16 17M12 21V12M20 16.7428C21.2215 15.734 22 14.2079 22 12.5C22 9.46243 19.5376 7 16.5 7C16.2815 7 16.0771 6.886 15.9661 6.69774C14.6621 4.48484 12.2544 3 9.5 3C5.35786 3 2 6.35786 2 10.5C2 12.5661 2.83545 14.4371 4.18695 15.7935"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {isSidebarOpen && (
                <span className="ml-2 text-xl font-bold">Admin Portal</span>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-gray-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                      } mr-3 h-5 w-5 transition-colors`}
                    />
                    {isSidebarOpen && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-slate-800 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <div>
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                    </div>
                    {isSidebarOpen && (
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {user?.email?.split('@')[0] || 'Admin User'}
                        </p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Administrator
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div className="fixed inset-0 flex z-40">
          <div
            className={`${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed inset-y-0 flex-shrink-0 w-full bg-white dark:bg-slate-950 transition-transform duration-300 ease-in-out md:hidden z-10`}
          >
            <div className="h-full flex flex-col">
              <div className="px-4 py-5 flex items-center justify-between border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-black dark:bg-white flex items-center justify-center rounded-md">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white dark:text-black"
                    >
                      <path
                        d="M8 17L12 21M12 21L16 17M12 21V12M20 16.7428C21.2215 15.734 22 14.2079 22 12.5C22 9.46243 19.5376 7 16.5 7C16.2815 7 16.0771 6.886 15.9661 6.69774C14.6621 4.48484 12.2544 3 9.5 3C5.35786 3 2 6.35786 2 10.5C2 12.5661 2.83545 14.4371 4.18695 15.7935"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="ml-2 text-xl font-bold">Admin Portal</span>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-5 overflow-y-auto">
                <nav className="px-4 space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          isActive
                            ? 'bg-gray-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                        } group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors`}
                      >
                        <item.icon
                          className={`${
                            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                          } mr-3 h-5 w-5 transition-colors`}
                        />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-slate-800 p-4">
                <div className="flex-shrink-0 group block">
                  <div className="flex items-center">
                    <div>
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {user?.email?.split('@')[0] || 'Admin User'}
                      </p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Administrator
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div 
            className={`${isSidebarOpen ? 'block' : 'hidden'} fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity md:hidden`}
            onClick={toggleSidebar}
          ></div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-slate-950 shadow border-b border-gray-200 dark:border-slate-800">
          <button
            onClick={toggleSidebar}
            className="px-4 md:hidden text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex items-center justify-between">
            <div className="ml-4 flex items-center md:ml-6">
              <ThemeToggle />
              
              <Button variant="ghost" size="icon" className="ml-2">
                <BellRing className="h-5 w-5" />
              </Button>
              
              <div className="ml-3 md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}