import AuthGuard from "@/components/auth/AuthGuard";
import Terminal from "@/components/terminal/Terminal";

export default function Home() {
  return (
    <AuthGuard>
      <Terminal />
    </AuthGuard>
  );
}
