import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout/AppLayout";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { InvitePage } from "./pages/InvitePage/InvitePage";
import { PropertiesPage } from "./pages/Properties/PropertiesPage";
import { PropertyDetailsPage } from "./pages/Properties/PropertyDetailsPage";
import { TenantsPage } from "./pages/Tenants/TenantsPage";
import { LeasesPage } from "./pages/Leases/LeasesPage";
import { PaymentsPage } from "./pages/Payments/PaymentsPage";
import { CabinetHomePage } from "./pages/Cabinet/CabinetHomePage";
import { CabinetLeasePage } from "./pages/Cabinet/CabinetLeasePage";
import { CabinetInvoicesPage } from "./pages/Cabinet/CabinetInvoicesPage";
import { MockGatewayPage } from "./pages/Cabinet/MockGatewayPage";
import { PayResultPage } from "./pages/Cabinet/PayResultPage";
import { AccountHomePage } from "./pages/AccountHomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { RequestsPage } from "./pages/Requests/RequestsPage";
import { CabinetRequestsPage } from "./pages/Requests/CabinetRequestsPage";

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
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="requests" element={<RequestsPage />} />
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

          {/* кабінет орендаря */}
          <Route element={<ProtectedRoute roles={["TENANT"]} />}>
            <Route element={<AppLayout />}>
              <Route path="my" element={<CabinetHomePage />} />
              <Route path="my/lease" element={<CabinetLeasePage />} />
              <Route path="my/invoices" element={<CabinetInvoicesPage />} />
              <Route path="my/requests" element={<CabinetRequestsPage />} />
              <Route
                path="my/settings"
                element={<PlaceholderPage title="Налаштування" />}
              />
              <Route path="my/pay/result" element={<PayResultPage />} />
            </Route>
            <Route path="pay/mock/:orderId" element={<MockGatewayPage />} />
          </Route>

          {/* тимчасова сторінка адміна */}
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="admin" element={<AccountHomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
