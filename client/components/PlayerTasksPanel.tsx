import { useChat } from "@/lib/useChat";
import { useTaskActions } from "../api/tasks";
import { Button } from "./ui/button";
import { type Task } from "db/schema";
import { differenceInSeconds } from "date-fns";
import { useState, useEffect } from "react";

function TaskCard({ task, userId }: { task: Task; userId: string }) {
  const { startTask, abortTask } = useTaskActions();
  const { sendMessage } = useChat(userId);
  const {
    targetName,
    algorithmName,
    taskType,
    probability,
    estimatedSecondsToComplete,
    status,
    goal,
    startedAt,
  } = task;
  const handleStartTask = () => {
    startTask(task.id);
    sendMessage(`HACK ${targetName} --algo=${algorithmName} --${taskType}`);
    setTimeout(() => {
      sendMessage(
        `starting hack - target: ${targetName} algorithm: ${algorithmName} objective: ${taskType}`
      );
    }, 1000);
  };

  const handleAbortTask = () => {
    abortTask(task.id);
    sendMessage(`Aborting - target: ${targetName}`);
  };

  return (
    <div className="bg-black rounded-md p-2 text-white border-[#00ff00] flex gap-2 w-full">
      <div className="flex flex-col w-full">
        <div>
          Goal: {goal} → {targetName} using {algorithmName}
        </div>
        {probability && <div>Success probability: {probability}</div>}
        <div className="capitalize">{status}</div>
        <TimeDisplay
          startedAt={startedAt}
          estimatedSecondsToComplete={estimatedSecondsToComplete}
          status={status}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleStartTask}
          disabled={status !== "pending"}
          className="border-white border text-white hover:bg-white/10"
        >
          Hack
        </Button>
        <Button
          onClick={handleAbortTask}
          disabled={status !== "pending" && status !== "analyzing"}
          className="border-white border text-white hover:bg-white/10"
        >
          Abort
        </Button>
      </div>
    </div>
  );
}

export function TasksPanel({
  tasks,
  username,
  userId,
}: {
  tasks: Task[];
  username: string;
  userId: string;
}) {
  return (
    <div className="bg-stone-800 w-auto p-2">
      <h2 className="text-[#FFFFFF] font-bold text-lg">Tasks</h2>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex gap-2">
            <TaskCard task={task} userId={userId} />
          </div>
        ))}
      </div>
    </div>
  );
}

const TimeDisplay = ({
  startedAt,
  estimatedSecondsToComplete,
  status,
}: {
  startedAt?: Date | null;
  estimatedSecondsToComplete?: number | null;
  status: string;
}) => {
  const [elapsedTime, setElapsedTime] = useState(
    startedAt ? differenceInSeconds(new Date(), startedAt) : 0
  );
  const remainingTime = estimatedSecondsToComplete! - elapsedTime;
  useEffect(() => {
    if (status !== "in-progress") return;
    const interval = setInterval(() => {
      const diff = differenceInSeconds(new Date(), startedAt!);
      if (diff !== elapsedTime) {
        setElapsedTime(diff);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [startedAt, status]);
  if (!startedAt && !estimatedSecondsToComplete) return null;
  const estimatedElement =
    estimatedSecondsToComplete &&
    ["in-progress", "pending"].includes(status) ? (
      <span>Estimated: {estimatedSecondsToComplete} seconds</span>
    ) : null;
  const runningElement =
    startedAt && status === "in-progress" ? (
      <span className="text-cyan-100">
        ({Math.max(remainingTime, 0)} remaining)
      </span>
    ) : null;
  return (
    <div className="flex gap-2">
      {estimatedElement}
      {runningElement}
    </div>
  );
};
