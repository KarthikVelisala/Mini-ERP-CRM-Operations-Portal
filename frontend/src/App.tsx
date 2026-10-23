import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ToastProvider } from './context/ToastProvider';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth, RequirePermission } from './components/routing/RouteGuards';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { CustomerFormPage } from './pages/customers/CustomerFormPage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { ProductFormPage } from './pages/products/ProductFormPage';
import { ProductDetailPage } from './pages/products/ProductDetailPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { ChallansPage } from './pages/challans/ChallansPage';
import { ChallanFormPage } from './pages/challans/ChallanFormPage';
import { ChallanDetailPage } from './pages/challans/ChallanDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />

                <Route path="customers">
                  <Route
                    index
                    element={
                      <RequirePermission permission="customer:read">
                        <CustomersPage />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="new"
                    element={
                      <RequirePermission permission="customer:write">
                        <CustomerFormPage />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path=":id"
                    element={
                      <RequirePermission permission="customer:read">
                        <CustomerDetailPage />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path=":id/edit"
                    element={
                      <RequirePermission permission="customer:write">
                        <CustomerFormPage />
                      </RequirePermission>
                    }
                  />
                </Route>

                <Route path="products">
                  <Route
                    index
                    element={
                      <RequirePermission permission="product:read">
                        <ProductsPage />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="new"
                    element={
                      <RequirePermission permission="product:write">
                        <ProductFormPage />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path=":id"
                    element={
                      <RequirePermission permission="product:read">
                        <ProductDetailPage />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path=":id/edit"
                    element={
                      <RequirePermission permission="product:write">
                        <ProductFormPage />
                      </RequirePermission>
                    }
                  />
                </Route>

                <Route
                  path="inventory"
                  element={
                    <RequirePermission permission="inventory:read">
                      <InventoryPage />
                    </RequirePermission>
                  }
                />

                <Route path="challans">
                  <Route
                    index
                    element={
                      <RequirePermission permission="challan:read">
                        <ChallansPage />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="new"
                    element={
                      <RequirePermission permission="challan:write">
                        <ChallanFormPage />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path=":id"
                    element={
                      <RequirePermission permission="challan:read">
                        <ChallanDetailPage />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path=":id/edit"
                    element={
                      <RequirePermission permission="challan:write">
                        <ChallanFormPage />
                      </RequirePermission>
                    }
                  />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

// Re-exported so route modules can guard themselves consistently.
export { RequirePermission };
