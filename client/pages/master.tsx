// import { clearAllMessages, useMessages } from '../api/messages';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { SimpleConfirmButton } from "@/components/ui/simple-confirm-button";
import { toast } from "sonner";
// import { buildMessagesString } from '../lib/build-messages-string';
import copy from "copy-to-clipboard";
// import { UserSettingsModal } from "@/components/UserSettingsModal";
// import { useSessionData } from '../api/sessionData';
import { useChat } from "@/lib/useChat";
import { useTasksList } from "@/api/tasks";
import { MasterTaskCard } from "@/components/MasterTask";

export function MasterPage() {
  const { messages, sendMessage, joinChat, isConnected } = useChat();
  const [fromEditable, setFromEditable] = useState(false);
  // const { getSessionDataQuery, setUserNameMutation, setSystemLevelMutation } = useSessionData({
  //   onUserNameChange: (newName) =>
  //     addMessage({
  //       fromName: 'System',
  //       fromRole: 'system',
  //       content: `User **${newName}** detected, welcome!`,
  //     }),
  //   onSystemLevelChange: (newSystemLevel) => {
  //     if (['basic', 'pro', 'premium'].includes(newSystemLevel)) {
  //       setSystemLevel(newSystemLevel as 'basic' | 'pro' | 'premium');
  //     }
  //   },
  // });
  const [systemLevel, setSystemLevel] = useState<"basic" | "pro" | "premium">(
    "basic"
  );
  const [from, setFrom] = useState("System");
  const tasks = useTasksList({ showAborted: true });

  const handleEnterClick = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage(e.currentTarget.value);
      e.currentTarget.value = "";
    }
  };
  const onCopyAll = () => {
    // copy(buildMessagesString(messages));
    joinChat("Nunizz");
    toast.success("Copied {} clipboard");
  };
  return (
    <div className="bg-blue-900 flex h-[100vh] text-white gap-5 w-full">
      <div className="flex flex-col justify-between w-[60%]">
        <div className="text-2xl bg-black p-2 flex justify-between">
          <div>Chat</div>
          <div className="flex gap-2">
            <Button onClick={onCopyAll}>
              join chat ({isConnected ? "connected" : "disconnected"})
            </Button>
            {/* <SimpleConfirmButton onConfirm={clearAllMessages}>
              Clear All
            </SimpleConfirmButton> */}
            {/* <UserSettingsModal
              username={username}
              setUsername={setUserNameMutation}
              systemLevel={systemLevel}
              setSystemLevel={setSystemLevelMutation}
            /> */}
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
              <Button onClick={() => setFromEditable(false)}>Set</Button>
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
        {tasks.tasks?.map((task) => (
          <MasterTaskCard task={task} />
        ))}
      </div>
    </div>
  );
}
