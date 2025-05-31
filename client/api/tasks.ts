import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const archiveTask = async (taskId: string) => {
  const res = await fetch(`/api/tasks/${taskId}/archive`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to archive task");
  return res.json();
};

const abortTask = async (taskId: string) => {
  const res = await fetch(`/api/tasks/${taskId}/abort`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to abort task");
  return res.json();
};

const startTask = async (taskId: string) => {
  const res = await fetch(`/api/tasks/${taskId}/start`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to start task");
  return res.json();
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error } = useMutation({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
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
  const queryClient = useQueryClient();

  const {
    mutate: updateTask,
    isPending: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: (task: Partial<Task> & { id: string }) => putTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const {
    mutate: archiveTaskMutation,
    isPending: isArchiving,
    error: archiveError,
  } = useMutation({
    mutationFn: archiveTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const {
    mutate: abortTaskMutation,
    isPending: isAborting,
    error: abortError,
  } = useMutation({
    mutationFn: abortTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const {
    mutate: startTaskMutation,
    isPending: isStarting,
    error: startError,
  } = useMutation({
    mutationFn: startTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const completeTask = (taskId: string) =>
    updateTask({ id: taskId, status: "success" });

  const failTask = (taskId: string) =>
    updateTask({ id: taskId, status: "fail" });

  const resolveTaskAnalysis = (
    taskId: string,
    {
      secondsToComplete,
      probability,
    }: { secondsToComplete: number; probability: number }
  ) =>
    updateTask({
      id: taskId,
      status: "pending",
      estimatedSecondsToComplete: secondsToComplete,
      probability,
    });

  return {
    archiveTask: archiveTaskMutation,
    startTask: startTaskMutation,
    abortTask: abortTaskMutation,
    completeTask,
    failTask,
    resolveTaskAnalysis,
    isPending: isUpdating || isArchiving || isAborting || isStarting,
    error: updateError || archiveError || abortError || startError,
  };
};
