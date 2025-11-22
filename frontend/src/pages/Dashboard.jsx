
import Chat from "../components/Chat";

// TEMP until RepoContext added
const activeRepo = null;

export default function Dashboard() {
  return (
    <div className="h-full w-full">
      <Chat activeRepo={activeRepo} />
    </div>
  );
}
