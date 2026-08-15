"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AccountContextType {
  activeAccount: string;
  setActiveAccount: (account: string) => void;
  isAskAiOpen: boolean;
  setIsAskAiOpen: (open: boolean) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [activeAccount, setActiveAccountState] = useState("Daclong120");
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sinomedia_active_account");
    if (saved) {
      setTimeout(() => {
        setActiveAccountState(saved);
      }, 0);
    }
  }, []);

  const setActiveAccount = (account: string) => {
    setActiveAccountState(account);
    try {
      localStorage.setItem("sinomedia_active_account", account);
    } catch (e) {
      console.warn("localStorage not available", e);
    }
  };

  return (
    <AccountContext.Provider value={{ activeAccount, setActiveAccount, isAskAiOpen, setIsAskAiOpen }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
}
