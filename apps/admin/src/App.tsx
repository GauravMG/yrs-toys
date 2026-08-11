import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@yrs/ui";
import { queryClient } from "./lib/query-client";
import { useBootstrapAuth } from "./hooks/useBootstrapAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { AppLayout } from "./components/layout/AppLayout";
import { SessionListener } from "./components/SessionListener";

import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsListPage } from "./pages/products/ProductsListPage";
import { ProductFormPage } from "./pages/products/ProductFormPage";
import { CategoriesListPage } from "./pages/categories/CategoriesListPage";
import { CategoryFormPage } from "./pages/categories/CategoryFormPage";
import { OrdersListPage } from "./pages/orders/OrdersListPage";
import { OrderDetailPage } from "./pages/orders/OrderDetailPage";
import { CouponsListPage } from "./pages/coupons/CouponsListPage";
import { CouponFormPage } from "./pages/coupons/CouponFormPage";
import { ReviewsPage } from "./pages/reviews/ReviewsPage";
import { CustomersPage } from "./pages/customers/CustomersPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function AppRoutes() {
  useBootstrapAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAdmin />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/products/new" element={<ProductFormPage mode="create" />} />
          <Route path="/products/:id/edit" element={<ProductFormPage mode="edit" />} />

          <Route path="/categories" element={<CategoriesListPage />} />
          <Route path="/categories/new" element={<CategoryFormPage mode="create" />} />
          <Route path="/categories/:id/edit" element={<CategoryFormPage mode="edit" />} />

          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />

          <Route path="/coupons" element={<CouponsListPage />} />
          <Route path="/coupons/new" element={<CouponFormPage mode="create" />} />
          <Route path="/coupons/:id/edit" element={<CouponFormPage mode="edit" />} />

          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <SessionListener />
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
