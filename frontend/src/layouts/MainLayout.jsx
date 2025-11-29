import LeftSidebar from "../components/LeftSidebar";
import AppHeader from "../components/AppHeader";
import RightSidebar from "../components/RightSidebar";
import { useAuth } from "../context/AuthContext";

export default function MainLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative bg-[#0B0D10] text-white">

      {/* Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D1014] via-[#0B0D10] to-black opacity-90 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#1c1f26_1px,transparent_1px),linear-gradient(to_bottom,#1c1f26_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.07]" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.045] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* HEADER */}
      <div className="relative z-20 shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
        <AppHeader />
      </div>

      {/* MAIN SPLIT AREA */}
      <div className="flex flex-1 overflow-hidden h-full relative z-10 backdrop-blur-[1px]">

        {/* LEFT SIDEBAR */}
        <div className="hidden md:flex h-full">
          <LeftSidebar />
        </div>

        {/* CENTER CONTENT */}
        <main className="flex-1 flex flex-col h-full overflow-hidden px-5 py-6 md:px-8 md:py-7">
          {children}
        </main>

        {/* RIGHT SIDEBAR */}
        <div className="hidden lg:flex h-full">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
