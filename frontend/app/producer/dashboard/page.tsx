"use client";

import React, { useEffect } from "react";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { DashboardView } from "../../../components/views/DashboardView";

export default function ProducerDashboardPage() {
  const { setRole } = useApp();

  useEffect(() => {
    setRole("PRODUCER");
  }, [setRole]);

  return (
    <DashboardLayout activeNavId="overview">
      <DashboardView />
    </DashboardLayout>
  );
}
