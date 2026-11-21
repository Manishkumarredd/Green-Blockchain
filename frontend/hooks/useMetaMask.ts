"use client";

import { useState, useEffect, useCallback } from "react";

export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111 in hex
export const SEPOLIA_CHAIN_ID_DEC = 11155111;
export const HARDHAT_CHAIN_ID_HEX = "0x7a69"; // 31337 in hex
export const HARDHAT_CHAIN_ID_DEC = 31337;

export function isSupportedChain(chainId: string | null): boolean {
  if (!chainId) return false;
  const dec = parseInt(chainId, 16);
  const hex = chainId.toLowerCase();
  return (
    hex === SEPOLIA_CHAIN_ID_HEX ||
    dec === SEPOLIA_CHAIN_ID_DEC ||
    hex === HARDHAT_CHAIN_ID_HEX ||
    dec === HARDHAT_CHAIN_ID_DEC ||
    dec === 1337 ||
    hex === "0x539"
  );
}

export interface MetaMaskState {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  isSepolia: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useMetaMask() {
  const [state, setState] = useState<MetaMaskState>({
    isInstalled: false,
    isConnected: false,
    address: null,
    chainId: null,
    isSepolia: false,
    isConnecting: false,
    error: null,
  });

  // Check if MetaMask is installed on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasEthereum = Boolean(window.ethereum);
      const isMetaMask = Boolean(window.ethereum?.isMetaMask);
      const isInstalled = hasEthereum && isMetaMask;

      setState((prev) => ({
        ...prev,
        isInstalled,
      }));

      if (window.ethereum) {
        // Query existing connected accounts without prompting
        window.ethereum
          .request({ method: "eth_accounts" })
          .then((accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              const address = accounts[0];
              const chainId = window.ethereum.chainId;
              setState((prev) => ({
                ...prev,
                isConnected: true,
                address,
                chainId,
                isSepolia: isSupportedChain(chainId),
              }));
            }
          })
          .catch(() => {});

        // Listen for account changes
        const handleAccountsChanged = (accounts: string[]) => {
          if (!accounts || accounts.length === 0) {
            setState((prev) => ({
              ...prev,
              isConnected: false,
              address: null,
            }));
          } else {
            setState((prev) => ({
              ...prev,
              isConnected: true,
              address: accounts[0],
            }));
          }
        };

        // Listen for network / chain changes
        const handleChainChanged = (chainId: string) => {
          const isSepolia = isSupportedChain(chainId);
          setState((prev) => ({
            ...prev,
            chainId,
            isSepolia,
          }));
        };

        window.ethereum.on?.("accountsChanged", handleAccountsChanged);
        window.ethereum.on?.("chainChanged", handleChainChanged);

        return () => {
          window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
          window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
        };
      }
    }
  }, []);

  // Request connection
  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState((prev) => ({
        ...prev,
        error: "MetaMask is not installed. Please install the MetaMask extension.",
      }));
      return null;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts authorized by user.");
      }

      const address = accounts[0];
      const chainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      const isSepolia = isSupportedChain(chainId);

      setState({
        isInstalled: true,
        isConnected: true,
        address,
        chainId,
        isSepolia,
        isConnecting: false,
        error: null,
      });

      return address;
    } catch (err: any) {
      const errorMsg = err.code === 4001 ? "User rejected the connection request." : err.message || "Failed to connect wallet.";
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMsg,
      }));
      return null;
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      address: null,
    }));
  }, []);

  // Switch to Sepolia Testnet
  const switchToSepolia = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added to MetaMask (error 4902)
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: "Ethereum Sepolia Testnet",
                nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
          return true;
        } catch (addError) {
          return false;
        }
      }
      return false;
    }
  }, []);

  // Sign message for secure nonce-based authentication
  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!window.ethereum || !state.address) {
        throw new Error("Wallet not connected.");
      }
      try {
        const signature = (await window.ethereum.request({
          method: "personal_sign",
          params: [message, state.address],
        })) as string;
        return signature;
      } catch (err: any) {
        throw new Error(err.code === 4001 ? "Signature request rejected by user." : "Signature failed.");
      }
    },
    [state.address]
  );

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    signMessage,
  };
}
