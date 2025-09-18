"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type TabValue = "all" | "low" | "expiring";

interface TabsContextValue {
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export function TabsProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

export function useTabsStore() {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error("useTabsStore must be used within a TabsProvider");
  }
  return context;
}
