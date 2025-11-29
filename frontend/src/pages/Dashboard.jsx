
import Chat from "../components/Chat";
import { useRepo } from "../context/RepoContext";

export default function Dashboard() {
  const { activeRepo } = useRepo(); // ← logic untouched

  return (
    <div
      className="
        h-full w-full
        overflow-hidden
        flex items-stretch
        relative
      "
    >
      {/* Chat Container */}
      <div
        className="
          flex-1
          h-full
          w-full
          overflow-hidden
          bg-transparent
          px-2 sm:px-4 md:px-6
          py-3 md:py-4
        "
      >
        <Chat activeRepo={activeRepo} />
      </div>
    </div>
  );
}
