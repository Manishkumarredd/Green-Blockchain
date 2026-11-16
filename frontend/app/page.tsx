"use client";

import React, { useState } from "react";
import { AppProvider, useApp } from "../components/common/AppContext";
import { PublicLayout } from "../components/layout/PublicLayout";
import { AuthLayout } from "../components/layout/AuthLayout";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { PublicLandingView } from "../components/views/PublicLandingView";
import { DashboardView } from "../components/views/DashboardView";
import { ShowroomView } from "../components/views/ShowroomView";

function MainContent() {
  const { activeView } = useApp();
  const [activeNavId, setActiveNavId] = useState("overview");

  if (activeView === "landing") {
    return (
      <PublicLayout>
        <PublicLandingView />
      </PublicLayout>
    );
  }

  if (activeView === "auth") {
    return <AuthLayout />;
  }

  if (activeView === "showroom") {
    return (
      <DashboardLayout activeNavId={activeNavId} onNavSelect={setActiveNavId}>
        <ShowroomView />
      </DashboardLayout>
    );
  }

  // Default: Dashboard View
  return (
    <DashboardLayout activeNavId={activeNavId} onNavSelect={setActiveNavId}>
      <DashboardView />
    </DashboardLayout>
  );
}

export default function Home() {
  return <MainContent />;
}
