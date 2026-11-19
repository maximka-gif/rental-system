import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout/AppLayout";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { InvitePage } from "./pages/InvitePage/InvitePage";
import { PropertiesPage } from "./pages/Properties/PropertiesPage";
import { PropertyDetailsPage } from "./pages/Properties/PropertyDetailsPage";
import { TenantsPage } from "./pages/Tenants/TenantsPage";
import { AccountHomePage } from "./pages/AccountHomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { LeasesPage } from "./pages/Leases/LeasesPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />

          {/* сторінки власника */}
          <Route element={<ProtectedRoute roles={["OWNER"]} />}>
            <Route element={<AppLayout />}>
              <Route index element={<PlaceholderPage title="Дашборд" />} />
              <Route path="properties" element={<PropertiesPage />} />
              <Route path="properties/:id" element={<PropertyDetailsPage />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="leases" element={<LeasesPage />} />
              <Route
                path="payments"
                element={<PlaceholderPage title="Платежі" />}
              />
              <Route
                path="requests"
                element={<PlaceholderPage title="Заявки на ремонт" />}
              />
              <Route
                path="finance"
                element={<PlaceholderPage title="Фінанси" />}
              />
              <Route
                path="settings"
                element={<PlaceholderPage title="Налаштування" />}
              />
            </Route>
          </Route>

          {/* тимчасові сторінки орендаря й адміна */}
          <Route element={<ProtectedRoute roles={["TENANT"]} />}>
            <Route path="my" element={<AccountHomePage />} />
          </Route>
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="admin" element={<AccountHomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
