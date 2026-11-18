import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout/AppLayout";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<PlaceholderPage title="Дашборд" />} />
              <Route path="properties" element={<PropertiesPage />} />
              <Route path="tenants" element={<PlaceholderPage title="Орендарі" />} />
              <Route path="leases" element={<PlaceholderPage title="Договори" />} />
              <Route path="payments" element={<PlaceholderPage title="Платежі" />} />
              <Route path="requests" element={<PlaceholderPage title="Заявки на ремонт" />} />
              <Route path="finance" element={<PlaceholderPage title="Фінанси" />} />
              <Route path="settings" element={<PlaceholderPage title="Налаштування" />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;