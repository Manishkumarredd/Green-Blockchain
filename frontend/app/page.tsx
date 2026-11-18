"use client";

import React, { useState } from "react";
import { useApp } from "../components/common/AppContext";
import { PublicLayout } from "../components/layout/PublicLayout";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { PublicLandingView } from "../components/views/PublicLandingView";
import { ShowroomView } from "../components/views/ShowroomView";

export default function Home() {
  const { activeView } = useApp();
  const [activeNavId, setActiveNavId] = useState("overview");

  if (activeView === "showroom") {
    return (
      <DashboardLayout activeNavId={activeNavId} onNavSelect={setActiveNavId}>
        <ShowroomView />
      </DashboardLayout>
    );
  }

  return (
    <PublicLayout>
      <PublicLandingView />
    </PublicLayout>
  );
}
