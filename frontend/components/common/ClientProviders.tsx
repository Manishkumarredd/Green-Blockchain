"use client";

import React from "react";
import { AppProvider } from "./AppContext";

export const ClientProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AppProvider>{children}</AppProvider>;
};
