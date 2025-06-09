import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SimpleConfirmButton } from "@/components/ui/simple-confirm-button";
import { toast } from "sonner";
import { buildMessagesString } from "@/lib/build-messages-string";
import copy from "copy-to-clipboard";
import { useChat } from "@/lib/useChat";
import { useTasksList } from "@/api/tasks";
import { MasterTaskCard } from "@/components/MasterTask";
import { UserSettingsModal } from "@/components/UserSettingsModal";

const userId = "master";

export function MasterPage() {
  const {
    messages,
    sendMessage,
    joinChat,
    isConnected,
    clearMessages,
    activeUsers,
    updateUsername,
  } = useChat(userId);
  const [fromEditable, setFromEditable] = useState(false);
  const [from, setFrom] = useState("System");
  const tasks = useTasksList({ showAborted: true });

  const playerDisplayName =
    activeUsers.find((user) => user.id === "player")?.username || "loading...";

  useEffect(() => {
    if (isConnected && !activeUsers.some((user) => user.id === userId)) {
      joinChat(from);
    }
  }, [joinChat, isConnected, from]);
  // const { getSessionDataQuery, setUserNameMutation, setSystemLevelMutation } = useSessionData({
  //   onSystemLevelChange: (newSystemLevel) => {
  //     if (['basic', 'pro', 'premium'].includes(newSystemLevel)) {
  //       setSystemLevel(newSystemLevel as 'basic' | 'pro' | 'premium');
  //     }
  //   },
  // });
  const [systemLevel, setSystemLevel] = useState<"basic" | "pro" | "premium">(
    "basic"
  );

  const handleEnterClick = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage(e.currentTarget.value);
      e.currentTarget.value = "";
    }
  };
  const onCopyAll = () => {
    copy(buildMessagesString(messages));
    toast.success("Copied to clipboard");
  };
  const handleUsernameUpdate = (newUsername: string) => {
    setFrom(newUsername);
    setFromEditable(false);
    updateUsername(newUsername);
  };

  return (
    <div className="bg-blue-900 flex h-[100vh] text-white gap-5 w-full">
      <div className="flex flex-col justify-between w-[60%]">
        <div className="text-2xl bg-black p-2 flex justify-between">
          <div>Chat</div>
          <div className="flex gap-2">
            <Button onClick={onCopyAll}>Copy all messages</Button>
            <SimpleConfirmButton onConfirm={clearMessages}>
              Clear All
            </SimpleConfirmButton>
            <UserSettingsModal
              username={playerDisplayName}
              setUsername={(newUsername) =>
                updateUsername(newUsername, "player")
              }
              systemLevel={systemLevel}
              setSystemLevel={setSystemLevel}
            />
          </div>
        </div>
        <div className="flex flex-col grow bg-eggplant-100">
          {messages.map((message, idx) => (
            <div key={idx} className="flex gap-2">
              <div className="text-eggplant-600">{message.fromName}:</div>
              <div className="text-white">{message.content}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 text-black items-center">
          {fromEditable ? (
            <>
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="text-black bg-stone-400 border rounded-md p-2  w-32"
              />
              <Button onClick={() => handleUsernameUpdate(from)}>Set</Button>
            </>
          ) : (
            <span onClick={() => setFromEditable(true)}>from: {from}</span>
          )}
          <input
            type="text"
            className="text-black bg-stone-400 border rounded-md p-2  grow"
            onKeyDown={handleEnterClick}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 border-red-900 border-2 rounded p-2">
        <div className="text-xl mb-2">Active Users</div>
        {activeUsers.map((user) => (
          <div key={user.id} className="text-white">
            {user.username} - {user.id}
          </div>
        ))}
        <div className="text-xl mt-4 mb-2">Tasks</div>
        {tasks.tasks?.map((task) => (
          <MasterTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
