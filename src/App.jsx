import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import ProtectedRoute from "@/routes/ProtectedRoute";
import Shell from "@/components/layout/Shell";
import LoginPage from "@/components/auth/LoginPage";
import SignupPage from "@/components/auth/SignupPage";
import ForgotPasswordPage from "@/components/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/components/auth/ResetPasswordPage";
import NoAccessPage from "@/components/auth/NoAccessPage";
import SharePage from "@/components/share/SharePage";
import BoardPage from "@/pages/BoardPage";
import TeamPage from "@/pages/TeamPage";

export default function App() {
  useEffect(() => {
    useAuthStore.getState().init();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/no-access" element={<NoAccessPage />} />
        <Route path="/share/:token" element={<SharePage />} />

        <Route
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<BoardPage />} />
          <Route path="/team" element={<TeamPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
