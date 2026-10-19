import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DrawerMenu } from './components/DrawerMenu';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { WizardPage } from './pages/WizardPage';
import { VisualizationPage } from './pages/VisualizationPage';
import { HistoryPage } from './pages/HistoryPage';
import { TemplatePage } from './pages/TemplatePage';
import { UsersPage } from './pages/UsersPage';
import { SyncPage } from './pages/SyncPage';
import { SettingsPage } from './pages/SettingsPage';
import { api, getStoredToken, setStoredToken } from './api/client';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Inicializar tema y auto-login inicial para desarrollo
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      // Auto-login con el usuario Administrador inicial sembrado
      api.login('admin@daedalous.local', 'Admin123*').then((res) => {
        setStoredToken(res.token);
        setCurrentUser(res.user);
      }).catch(console.error);
    } else {
      api.getMe().then((res) => {
        setCurrentUser(res.user);
      }).catch(() => {
        // Si el token expiró, reautenticar
        api.login('admin@daedalous.local', 'Admin123*').then((res) => {
          setStoredToken(res.token);
          setCurrentUser(res.user);
        }).catch(console.error);
      });
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleOpenWizard = (projectId?: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('wizard');
  };

  const handleOpenHistory = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('history');
  };

  const handleOpenStep = (projectId: string, stepKey: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('wizard');
  };

  return (
    <div className="app-container">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        user={currentUser}
        onNavigate={setCurrentView}
      />

      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeView={currentView}
        onNavigate={setCurrentView}
      />

      <main className="main-content">
        {currentView === 'home' && (
          <HomePage
            onNavigate={setCurrentView}
            onOpenWizard={() => handleOpenWizard()}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsPage
            onOpenWizard={handleOpenWizard}
            onOpenHistory={handleOpenHistory}
          />
        )}

        {currentView === 'wizard' && (
          <WizardPage
            projectId={selectedProjectId}
            onBack={() => setCurrentView('projects')}
            onOpenHistory={handleOpenHistory}
          />
        )}

        {currentView === 'visualization' && (
          <VisualizationPage />
        )}

        {currentView === 'history' && (
          <HistoryPage
            initialProjectId={selectedProjectId}
            onOpenStep={handleOpenStep}
          />
        )}

        {currentView === 'template' && (
          <TemplatePage />
        )}

        {currentView === 'users' && (
          <UsersPage />
        )}

        {currentView === 'sync' && (
          <SyncPage />
        )}

        {currentView === 'settings' && (
          <SettingsPage />
        )}
      </main>
    </div>
  );
};
