import { useMutation, useQuery } from "@tanstack/react-query";
import { NewTask, type Task } from "db/schema";
import { getAnalysisMessage } from "content/messageTemplates";

const fetchTasks = async ({
  showAborted,
}: {
  showAborted: boolean;
}): Promise<Task[]> => {
  const res = await fetch(`/api/tasks?showAborted=${showAborted}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
};

const postTask = async (task: NewTask) => {
  const res = await fetch("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
};

const putTask = async (task: Partial<Task> & { id: string }) => {
  const res = await fetch(`/api/tasks/${task.id}`, {
    method: "PUT",
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
};

const deleteTask = async (taskId: string) => {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.json();
};

export const useCreateTask = () => {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (
      task: Pick<NewTask, "targetName" | "algorithmName" | "goal">
    ) =>
      postTask({
        ...task,
        description: getAnalysisMessage(task.targetName, task.algorithmName),
        status: "analyzing",
        taskType: "disable",
        startedAt: null,
      }),
  });
  return mutate;
};

export const useTasksList = ({ showAborted }: { showAborted: boolean }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", showAborted],
    queryFn: () => fetchTasks({ showAborted }),
  });
  return {
    tasks: data,
    isLoading,
    error,
  };
};

export const useTaskActions = () => {
  const { mutate, isPending, error } = useMutation({
    mutationFn: (task: Partial<Task> & { id: string }) => putTask(task),
  });
  const archiveTask = (taskId: string) =>
    mutate({ id: taskId, archivedAt: new Date() });

  const startTask = (taskId: string) =>
    mutate({ id: taskId, status: "in-progress" });

  const abortTask = (taskId: string) =>
    mutate({ id: taskId, status: "aborted" });

  const completeTask = (taskId: string) =>
    mutate({ id: taskId, status: "success" });

  const failTask = (taskId: string) => mutate({ id: taskId, status: "fail" });

  const resolveTaskAnalysis = (
    taskId: string,
    {
      secondsToComplete,
      probability,
    }: { secondsToComplete: number; probability: number }
  ) =>
    mutate({
      id: taskId,
      status: "pending",
      estimatedSecondsToComplete: secondsToComplete,
      probability,
    });

  return {
    archiveTask,
    startTask,
    abortTask,
    completeTask,
    failTask,
    resolveTaskAnalysis,
  };
};
