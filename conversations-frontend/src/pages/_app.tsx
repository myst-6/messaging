import type { AppProps } from "next/app";
import { Provider } from "@/components/ui/provider";
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "@/components/ui/toaster";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider forcedTheme="light">
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
      </AuthProvider>
    </Provider>
  );
}
