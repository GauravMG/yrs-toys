import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { HomePage } from "./pages/HomePage";
import { ShopPage } from "./pages/ShopPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { CheckoutSuccessPage } from "./pages/CheckoutSuccessPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { AboutPage } from "./pages/AboutPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AccountLayout } from "./pages/account/AccountLayout";
import { OrdersPage } from "./pages/account/OrdersPage";
import { OrderDetailPage } from "./pages/account/OrderDetailPage";
import { AddressesPage } from "./pages/account/AddressesPage";
import { WishlistPage } from "./pages/account/WishlistPage";
import { ProfilePage } from "./pages/account/ProfilePage";
import { useAuthBootstrap } from "./hooks/useAuthBootstrap";

export function App() {
  useAuthBootstrap();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="product/:slug" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/success/:orderNumber" element={<CheckoutSuccessPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="about" element={<AboutPage />} />

        <Route path="account" element={<AccountLayout />}>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderNumber" element={<OrderDetailPage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
