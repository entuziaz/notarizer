"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider } from "ethers";

import { getErrorMessage } from "@/lib/errors";
import {
  explorerAddressUrl,
  getBrowserProvider,
  rootstockTestnetChainId,
} from "@/lib/rootstock";

type WalletStatus =
  | "idle"
  | "no-wallet"
  | "ready"
  | "wrong-network"
  | "connecting"
  | "connected";

type WalletContextValue = {
  account: string | null;
  chainId: number | null;
  hasWallet: boolean;
  isWrongNetwork: boolean;
  isConnected: boolean;
  status: WalletStatus;
  isHydrated: boolean;
  errorMessage: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToRootstock: () => Promise<void>;
  explorerUrl: string | null;
};

const WalletContext = createContext<WalletContextValue | null>(null);

type WalletProviderProps = {
  children: ReactNode;
};

export function WalletProvider({ children }: WalletProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [isHydrated, setIsHydrated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocallyDisconnected, setIsLocallyDisconnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const injectedProvider = getBrowserProvider();

    if (injectedProvider === null) {
      setHasWallet(false);
      setStatus("no-wallet");
      setIsHydrated(true);
      return;
    }

    setHasWallet(true);
    const provider = injectedProvider;

    async function syncWalletState() {
      try {
        const browserProvider = new BrowserProvider(provider);
        const [accounts, network] = await Promise.all([
          provider.request({ method: "eth_accounts" }),
          browserProvider.getNetwork(),
        ]);

        if (cancelled) {
          return;
        }

        const nextAccounts = Array.isArray(accounts)
          ? accounts.filter((value): value is string => typeof value === "string")
          : [];
        const nextAccount =
          !isLocallyDisconnected && nextAccounts.length > 0 ? nextAccounts[0] : null;
        const nextChainId = Number(network.chainId);
        const wrongNetwork = nextChainId !== rootstockTestnetChainId;

        setAccount(nextAccount);
        setChainId(nextChainId);
        setStatus(
          nextAccount === null
            ? wrongNetwork
              ? "wrong-network"
              : "ready"
            : wrongNetwork
              ? "wrong-network"
              : "connected",
        );
        setErrorMessage(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(getErrorMessage(error));
        setStatus("ready");
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    }

    const handleAccountsChanged = (accounts: unknown) => {
      const nextAccount =
        !isLocallyDisconnected &&
        Array.isArray(accounts) &&
        typeof accounts[0] === "string"
          ? accounts[0]
          : null;

      setAccount(nextAccount);
      setStatus(() => {
        if (chainId !== null && chainId !== rootstockTestnetChainId) {
          return "wrong-network";
        }

        return nextAccount === null ? "ready" : "connected";
      });
    };

    const handleChainChanged = (nextChainId: unknown) => {
      const normalizedChainId =
        typeof nextChainId === "string" ? Number.parseInt(nextChainId, 16) : null;
      setChainId(normalizedChainId);
      setStatus(() => {
        const wrongNetwork =
          normalizedChainId === null || normalizedChainId !== rootstockTestnetChainId;

        if (wrongNetwork) {
          return "wrong-network";
        }

        return account === null || isLocallyDisconnected ? "ready" : "connected";
      });
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    void syncWalletState();

    return () => {
      cancelled = true;
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [account, chainId, isLocallyDisconnected]);

  async function connectWallet() {
    const provider = getBrowserProvider();

    if (provider === null) {
      setHasWallet(false);
      setStatus("no-wallet");
      setErrorMessage("No injected wallet was found. Install MetaMask or another EIP-1193 wallet.");
      return;
    }

    try {
      setStatus("connecting");
      setErrorMessage(null);
      setIsLocallyDisconnected(false);

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      const browserProvider = new BrowserProvider(provider);
      const network = await browserProvider.getNetwork();

      const nextAccount =
        Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
      const nextChainId = Number(network.chainId);
      const wrongNetwork = nextChainId !== rootstockTestnetChainId;

      setAccount(nextAccount);
      setChainId(nextChainId);
      setStatus(
        nextAccount === null
          ? wrongNetwork
            ? "wrong-network"
            : "ready"
          : wrongNetwork
            ? "wrong-network"
            : "connected",
      );
    } catch (error) {
      setStatus(chainId !== null && chainId !== rootstockTestnetChainId ? "wrong-network" : "ready");
      setErrorMessage(getErrorMessage(error));
    }
  }

  function disconnectWallet() {
    setIsLocallyDisconnected(true);
    setAccount(null);
    setErrorMessage(null);
    setStatus(chainId !== null && chainId !== rootstockTestnetChainId ? "wrong-network" : "ready");
  }

  async function switchToRootstock() {
    const provider = getBrowserProvider();

    if (provider === null) {
      setHasWallet(false);
      setStatus("no-wallet");
      setErrorMessage("No injected wallet was found. Install MetaMask or another EIP-1193 wallet.");
      return;
    }

    try {
      setErrorMessage(null);
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1f" }],
      });
    } catch {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x1f",
              chainName: "Rootstock Testnet",
              nativeCurrency: {
                name: "Test RBTC",
                symbol: "tRBTC",
                decimals: 18,
              },
              rpcUrls: ["https://public-node.testnet.rsk.co"],
              blockExplorerUrls: ["https://rootstock-testnet.blockscout.com"],
            },
          ],
        });
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      }
    }
  }

  const value: WalletContextValue = {
    account,
    chainId,
    hasWallet,
    isWrongNetwork: chainId !== null && chainId !== rootstockTestnetChainId,
    isConnected: account !== null && chainId === rootstockTestnetChainId,
    status,
    isHydrated,
    errorMessage,
    connectWallet,
    disconnectWallet,
    switchToRootstock,
    explorerUrl: account === null ? null : explorerAddressUrl(account),
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (context === null) {
    throw new Error("useWallet must be used inside WalletProvider.");
  }

  return context;
}
