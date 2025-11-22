
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { RepoProvider } from "./context/RepoContext";
import { RepoImportProvider } from "./context/RepoImportContext";

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

          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {/* Repo context loads ONLY after user is authenticated */}
                <RepoProvider>
                  <RepoImportProvider>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
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
