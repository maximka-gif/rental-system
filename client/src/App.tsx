import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout/AppLayout";
import { PropertiesPage } from "./pages/PropertiesPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;