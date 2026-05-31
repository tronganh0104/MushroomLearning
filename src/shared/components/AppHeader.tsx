import { Moon, Sun } from "lucide-react";
import type { AppRoute, RouteDefinition } from "../../app/routes";
import { useSettings } from "../../features/settings/context/SettingsContext";

interface AppHeaderProps {
  activeRoute: AppRoute;
  routes: RouteDefinition[];
  onNavigate: (route: AppRoute) => void;
}

export function AppHeader({ activeRoute, routes, onNavigate }: AppHeaderProps) {
  const { settings, updateSettings } = useSettings();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === "light" ? "dark" : "light" });
  };

  return (
    <header className="app-header">
      <div className="app-brand">
        <div className="brand-icon">
          <img src="/icons/app-icon.png" alt="" aria-hidden="true" />
        </div>
        <div className="brand-text">
          <strong className="brand-name">MushroomLearning</strong>
          <span className="brand-suffix">Desktop</span>
        </div>
      </div>
      
      <div className="app-header-actions">
        <nav className="app-nav" aria-label="Primary navigation">
          {routes.map((route) => (
            <button
              className={route.id === activeRoute ? "nav-link active" : "nav-link"}
              key={route.id}
              type="button"
              onClick={() => onNavigate(route.id)}
            >
              {route.label}
            </button>
          ))}
        </nav>

        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${settings.theme === "light" ? "dark" : "light"} mode`}
        >
          {settings.theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}
