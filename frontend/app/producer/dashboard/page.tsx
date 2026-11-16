"use client";

import React, { useEffect } from "react";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { ProducerDashboardView } from "../../../components/views/ProducerDashboardView";

export default function ProducerDashboardPage() {
  const { setRole } = useApp();

  useEffect(() => {
    setRole("PRODUCER");
  }, [setRole]);

  return (
    <DashboardLayout activeNavId="overview">
      <ProducerDashboardView />
    </DashboardLayout>
  );
}
