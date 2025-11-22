import LeftSidebar from "../components/LeftSidebar";
import AppHeader from "../components/AppHeader";
import RightSidebar from "../components/RightSidebar";
import { useAuth } from "../context/AuthContext";

export default function MainLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[#0B0D10] text-white flex flex-col overflow-hidden relative">

      {/* Background micro-grid */}
      <div
        className="absolute inset-0 
          bg-[linear-gradient(to_right,#15181d_1px,transparent_1px),
              linear-gradient(to_bottom,#15181d_1px,transparent_1px)]
          bg-[size:38px_38px]
          opacity-[0.08]"
      />

      {/* Noise layer */}
      <div
        className="absolute inset-0 opacity-[0.04]
          bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
      />

      {/* TOP HEADER */}
      <AppHeader />

      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <LeftSidebar />

        {/* CENTER CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto relative z-10">
          {children}
        </main>

        {/* RIGHT SIDEBAR */}
        <RightSidebar />

      </div>
    </div>
  );
}
