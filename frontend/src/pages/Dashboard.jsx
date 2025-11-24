
import Chat from "../components/Chat";
import { useRepo } from "../context/RepoContext";

export default function Dashboard() {
  const { activeRepo } = useRepo();   // <-- get active repo from context

  return (
    <div className="h-full w-full">
      <Chat activeRepo={activeRepo} />
    </div>
  );
}
