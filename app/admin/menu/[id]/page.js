"use client";

import { useParams } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import AdminNav from "@/components/AdminNav";
import MenuItemForm from "@/components/MenuItemForm";

export default function EditMenuItemPage() {
  const { id } = useParams();
  return (
    <AdminGuard>
      <AdminNav active="/admin/menu" />
      <MenuItemForm itemId={id} />
    </AdminGuard>
  );
}
