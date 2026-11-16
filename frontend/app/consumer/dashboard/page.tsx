"use client";

import React, { useEffect } from "react";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { DashboardView } from "../../../components/views/DashboardView";

export default function ConsumerDashboardPage() {
  const { setRole } = useApp();

  useEffect(() => {
    setRole("CONSUMER");
  }, [setRole]);

  return (
    <DashboardLayout activeNavId="overview">
      <DashboardView />
    </DashboardLayout>
  );
}
