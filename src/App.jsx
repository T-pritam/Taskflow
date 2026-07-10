import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import ProtectedRoute from "@/routes/ProtectedRoute";
import LoginPage from "@/components/auth/LoginPage";
import SignupPage from "@/components/auth/SignupPage";
import ForgotPasswordPage from "@/components/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/components/auth/ResetPasswordPage";
import NoAccessPage from "@/components/auth/NoAccessPage";
import BoardPage from "@/pages/BoardPage";

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

        <Route
          element={
            <ProtectedRoute>
              
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<BoardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
