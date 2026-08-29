"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminNav from "@/components/AdminNav";
import MenuItemForm from "@/components/MenuItemForm";

export default function NewMenuItemPage() {
  return (
    <AdminGuard>
      <AdminNav active="/admin/menu" />
      <MenuItemForm />
    </AdminGuard>
  );
}
