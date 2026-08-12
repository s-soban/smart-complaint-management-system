import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

// Student
import { StudentDashboard } from './components/student/StudentDashboard';
import { FileComplaintForm } from './components/student/FileComplaintForm';

// Admin
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AllComplaintsTable } from './components/admin/AllComplaintsTable';
import { DuplicateManager } from './components/admin/DuplicateManager';
import { CampusInsightsView } from './components/admin/CampusInsightsView';
import { ReportsView } from './components/admin/ReportsView';
import { UsersManager } from './components/admin/UsersManager';
import { CategoryManager } from './components/admin/CategoryManager';

// Maintenance
import { MaintenanceDashboard } from './components/maintenance/MaintenanceDashboard';

// Modals & Auth
import { ComplaintDetailModal } from './components/common/ComplaintDetailModal';
import { NotificationModal } from './components/common/NotificationModal';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';

const MainApp: React.FC = () => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold tracking-wider text-slate-400">Loading Smart Complaint System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {authView === 'login' ? (
          <LoginForm
            onSwitchToRegister={() => setAuthView('register')}
            onOpenForgotPassword={() => setShowForgotPassword(true)}
          />
        ) : (
          <RegisterForm onSwitchToLogin={() => setAuthView('login')} />
        )}

        {showForgotPassword && (
          <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
        )}
      </>
    );
  }

  // Render workspace view based on active tab & role
  const renderTabContent = () => {
    if (role === 'student') {
      if (activeTab === 'file-complaint') {
        return (
          <FileComplaintForm
            onSuccess={(id) => {
              setSelectedComplaintId(id);
              setActiveTab('dashboard');
            }}
            onCancel={() => setActiveTab('dashboard')}
          />
        );
      }
      return (
        <StudentDashboard
          onFileNewComplaint={() => setActiveTab('file-complaint')}
          onSelectComplaint={(id) => setSelectedComplaintId(id)}
        />
      );
    }

    if (role === 'admin') {
      if (activeTab === 'all-complaints') {
        return <AllComplaintsTable onSelectComplaint={(id) => setSelectedComplaintId(id)} />;
      }
      if (activeTab === 'duplicates') {
        return <DuplicateManager onSelectComplaint={(id) => setSelectedComplaintId(id)} />;
      }
      if (activeTab === 'campus-insights') {
        return <CampusInsightsView />;
      }
      if (activeTab === 'reports') {
        return <ReportsView />;
      }
      if (activeTab === 'users') {
        return <UsersManager />;
      }
      if (activeTab === 'categories') {
        return <CategoryManager />;
      }
      return (
        <AdminDashboard
          onNavigateTab={(t) => setActiveTab(t)}
          onSelectComplaint={(id) => setSelectedComplaintId(id)}
        />
      );
    }

    if (role === 'maintenance') {
      return (
        <MaintenanceDashboard onSelectComplaint={(id) => setSelectedComplaintId(id)} />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex transition-colors font-sans">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenNotifications={() => setShowNotifications(true)}
        />

        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          {renderTabContent()}
        </main>
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaintId && (
        <ComplaintDetailModal
          complaintId={selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
        />
      )}

      {/* Notification Center Popover */}
      {showNotifications && (
        <NotificationModal
          onClose={() => setShowNotifications(false)}
          onSelectComplaint={(id) => {
            setShowNotifications(false);
            setSelectedComplaintId(id);
          }}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
