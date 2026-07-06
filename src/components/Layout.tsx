import { createSignal, type ParentProps } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import ConfirmModal from "./ConfirmModal";
import ToastHost from "./ToastHost";
import { LogOut } from "lucide-solid";
import { logout } from "../lib/stores";
import { t } from "../lib/i18n";

export default function Layout(props: ParentProps) {
  const [showLogout, setShowLogout] = createSignal(false);
  const navigate = useNavigate();

  return (
    <div class="min-h-screen bg-page">
      <Header />
      <Sidebar onLogout={() => setShowLogout(true)} />
      <MobileNav />
      <main class="relative ml-62.5 mt-[calc(60px+env(safe-area-inset-top,0px))] min-h-[calc(100vh-60px-env(safe-area-inset-top,0px))] overflow-y-auto bg-page p-7.5 max-[768px]:mb-[calc(94px+env(safe-area-inset-bottom,0px))] max-[768px]:ml-0 max-[768px]:p-5 max-[576px]:p-4">
        {props.children}
      </main>

      <ConfirmModal
        open={showLogout()}
        icon={LogOut}
        title={t("logout_modal.title")}
        body={<p>{t("logout_modal.body")}</p>}
        cancelText={t("common.cancel")}
        confirmText={t("logout_modal.confirm")}
        onCancel={() => setShowLogout(false)}
        onConfirm={() => {
          setShowLogout(false);
          logout();
          navigate("/login");
        }}
      />
      <ToastHost />
    </div>
  );
}
