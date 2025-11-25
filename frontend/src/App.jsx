
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { RepoProvider } from "./context/RepoContext";
import { RepoImportProvider } from "./context/RepoImportContext";
import { ChatProvider } from "./context/ChatContext";   // ✅ ADD THIS

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <h2 className="text-xl text-white">Loading...</h2>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RepoProvider>
                  <RepoImportProvider>
                    <ChatProvider>  {/* ✅ FIXED: WRAP HERE */}
                      <MainLayout>
                        <Dashboard />
                      </MainLayout>
                    </ChatProvider>
                  </RepoImportProvider>
                </RepoProvider>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
