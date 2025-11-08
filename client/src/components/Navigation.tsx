import { BookOpen, Settings, Users, Table } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/master-schedule", label: "الجدول الرئيسي", icon: Table },
    { path: "/teachers", label: "المعلمون", icon: Users },
    { path: "/classes", label: "الصفوف", icon: BookOpen },
    { path: "/template-settings", label: "الإعدادات", icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold font-heading">نظام جدولة الحصص</h1>
          </div>

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="default"
                    className="gap-2 transition-all duration-200"
                    data-testid={`nav-${item.label}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
