import { useEffect, useRef, useState } from "react";
import { useTasksList, useTaskActions, useCreateTask } from "../api/tasks";
import { TasksPanel } from "../components/PlayerTasksPanel";
import { Textarea } from "../components/ui/textarea";
import { StealthButton } from "../components/StealthButton";
import { useChat } from "../lib/useChat";

export const PlayerPage = () => {
  const { messages, sendMessage, joinChat, isConnected } = useChat();
  const { tasks } = useTasksList({ showAborted: false });
  const createTask = useCreateTask();
  const username = "Player"; // TODO: Replace with actual user data
  const systemLevel = "basic"; // TODO: Replace with actual system level
  const targetInputRef = useRef<HTMLInputElement>(null);
  const goalInputRef = useRef<HTMLInputElement>(null);
  const algorithmInputRef = useRef<HTMLSelectElement>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const historyMessage = messages[messages.length - historyCount - 1];

  useEffect(() => {
    // Join chat when component mounts
    isConnected && joinChat(username);
  }, [joinChat, username, isConnected]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "ArrowUp" &&
      (historyCount > 0 || e.currentTarget.value === "")
    ) {
      e.preventDefault();
      const newHistoryCount = historyCount + 1;
      const historyUserMessage = messages
        .filter((message) => message.fromRole === "user")
        .at(newHistoryCount - 1);
      if (historyUserMessage) {
        e.currentTarget.value = historyUserMessage.content;
      }
      setHistoryCount(newHistoryCount);
      return;
    }
    if (e.key === "ArrowDown" && historyCount > 0) {
      e.preventDefault();
      const newHistoryCount = historyCount - 1;
      const historyUserMessage = messages
        .filter((message) => message.fromRole === "user")
        .at(newHistoryCount - 1);
      if (historyUserMessage) {
        e.currentTarget.value = historyUserMessage.content;
      }
      setHistoryCount(newHistoryCount);
      return;
    }
    setHistoryCount(0);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const message = e.currentTarget.value;
      sendMessage(message);
      e.currentTarget.value = "";
    }
  };

  const onSupportClick = () => {
    supportMessages.forEach((message) => {
      sendMessage(message.content);
    });
  };

  const onCheckClick = () => {
    const target = targetInputRef.current?.value;
    const algorithm = algorithmInputRef.current?.value;
    const goal = goalInputRef.current?.value;
    if (!target || !algorithm || !goal) {
      return;
    }
    sendMessage(`CHECK: ${goal} - ${target} using ${algorithm}`);
    // Create a new task with the analysis
    createTask({
      goal,
      targetName: target,
      algorithmName: algorithm,
    });
    setTimeout(() => {
      sendMessage(getAnalysisMessage(target, algorithm));
    }, 1000);
    targetInputRef.current!.value = "";
    goalInputRef.current!.value = "";
  };

  return (
    <div className="text-[#00ff00] bg-gray-200 flex w-full h-[100vh] font-mono">
      <div className="flex flex-col justify-between w-[60%] bg-black">
        <div className="flex justify-between">
          <div className="text-[#00ff00] border-[#00ff00] border-dotted border-b">
            {`Cyber System ${systemLevelToTitle[systemLevel]} - ${username}`}
          </div>
        </div>
        <div className="text-[#00ff00] flex flex-col-reverse grow relative overflow-y-scroll">
          {messages.toReversed().map((message, idx) => (
            <div key={idx} className="flex gap-2 whitespace-pre-wrap">
              <div>{message.fromName}:</div>
              <div>{message.content}</div>
            </div>
          ))}
        </div>
        <Textarea
          className="rounded-md p-2 border-top border-2 border-white bg-black"
          onKeyDown={onKeyDown}
          placeholder={`Enter your message ${
            historyCount > 0 ? `(history: ${historyMessage?.content})` : ""
          }`}
        />
        <div className="text-[#00ff00] bg-gray-500 flex p-4 gap-2 ">
          <input
            type="text"
            className="rounded-md p-2 bg-black cursor-pointer"
            placeholder="target"
            ref={targetInputRef}
          />
          <input
            type="text"
            className="rounded-md p-2 bg-black cursor-pointer"
            placeholder="goal"
            ref={goalInputRef}
          />
          <select
            className="rounded-md p-2 bg-black cursor-pointer"
            ref={algorithmInputRef}
          >
            <option value="alpha">Alpha</option>
            <option value="beta">Beta</option>
            <option value="gamma">Gamma</option>
            <option value="delta">Delta</option>
          </select>
          <button
            className="rounded-md p-2 bg-black cursor-pointer border-[#00ff00] border-2"
            onClick={onCheckClick}
          >
            Send to Analysis
          </button>

          <button
            className="rounded-md p-2 bg-black cursor-pointer"
            onClick={onSupportClick}
          >
            SUPPORT
          </button>
        </div>
        <div className="flex gap-2 p-4">
          <StealthButton />
        </div>
      </div>
      {tasks && (
        <div className="grow bg-stone-800">
          <TasksPanel tasks={tasks} username={username} />
        </div>
      )}
    </div>
  );
};

const supportMessages = [
  {
    content: "alpha - probability - X time y",
  },
  {
    content: "beta - probability - Xx time yyy",
  },
  {
    content: "gamma - probability - Xxxx time yyyy",
  },
  {
    content: "delta - probability - xX time yyyyy",
  },
];

const systemLevelToTitle: Record<string, string> = {
  basic: "Mark I",
  pro: "Mark II Pro",
  premium: "Mark III Premium",
};

const getAnalysisMessage = (target: string, algorithm: string): string => {
  return `Analyzing ${target} using ${algorithm} algorithm...`;
};
