import { useState, useEffect, useRef } from "react";
import { type Task } from "db/schema";
import { SimpleSelect } from "./SimpleSelect";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { useTaskActions } from "../api/tasks";
import { differenceInSeconds } from "date-fns";
import {
  getAlgorithmResult,
  randomProbability,
  randomSecondsToComplete,
} from "content/algorithm";
import { Size, DefenseLevel } from "content/data-types";
import { Label } from "./ui/label";
import { ArrowRightIcon } from "lucide-react";
export const MasterTaskCard = ({ task }: { task: Task }) => {
  return (
    <div className=" border-white border-2 p-2 rounded-xl bg-slate-600">
      <div className="font-bold">
        Goal: {task.goal} → {task.targetName} using {task.algorithmName} -{" "}
        {task.status}
      </div>
      <div className="flex gap-2">
        {task.status === "analyzing" ? (
          <AnalysisPanel task={task} />
        ) : task.status === "in-progress" ? (
          <PostAnalysisPanel task={task} />
        ) : task.status === "pending" ? (
          <PendingPanel task={task} />
        ) : (
          <DonePanel task={task} />
        )}
      </div>
    </div>
  );
};

const PostAnalysisPanel = ({ task }: { task: Task }) => {
  const [elapsedTime, setElapsedTime] = useState(
    task.startedAt ? differenceInSeconds(new Date(), task.startedAt) : 0
  );
  const remainingTime = task.estimatedSecondsToComplete! - elapsedTime;
  const [switchState, setSwitchState] = useState<"success" | "fail">("success");
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = differenceInSeconds(new Date(), task.startedAt!);
      if (diff !== elapsedTime) {
        setElapsedTime(diff);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [task.startedAt]);
  const [value, setValue] = useState<"manual" | "auto">("manual");
  const { completeTask, failTask } = useTaskActions();
  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-2">
        <div>
          <span>Seconds to complete:</span>
          <span>{task.estimatedSecondsToComplete}</span>
        </div>
        <div>
          <span>Remaining:</span>
          <span>{remainingTime}</span>
        </div>
        <div>
          <span>PlayerProbability:</span>
          <span>{task.probability}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex space-x-2 items-center">
          <Checkbox
            checked={value === "auto"}
            onCheckedChange={(checked) => setValue(checked ? "auto" : "manual")}
          />
          <div>Override Resolution?</div>
        </div>
        {value === "auto" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              Fail
              <Switch
                className="data-[state=unchecked]:bg-red-500 data-[state=checked]:bg-lime-500"
                checked={switchState === "success"}
                onCheckedChange={(checked) =>
                  setSwitchState(checked ? "success" : "fail")
                }
              />
              Success
            </div>
            <Button
              onClick={() =>
                switchState === "success"
                  ? completeTask(task.id)
                  : failTask(task.id)
              }
            >
              {switchState} now
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">According to stats</div>
        )}
      </div>
    </div>
  );
};

const AnalysisPanel = ({ task }: { task: Task }) => {
  const { resolveTaskAnalysis } = useTaskActions();
  const distanceRef = useRef<HTMLInputElement>(null);
  const [defLevel, setDefLevel] = useState<DefenseLevel>("easy");
  const [size, setSize] = useState<Size>("small");
  const secondsToCompleteRef = useRef<HTMLInputElement>(null);
  const probabilityRef = useRef<HTMLInputElement>(null);
  const handleRandomize = (level: "easy" | "medium" | "hard") => {
    const secondsToComplete = randomSecondsToComplete(level);
    const probability = randomProbability(level);
    if (secondsToCompleteRef.current)
      secondsToCompleteRef.current.value = secondsToComplete.toString();
    if (probabilityRef.current)
      probabilityRef.current.value = probability.toString();
  };
  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-2 w-56">
        <div className="">Calculate by Target</div>
        <div className="flex gap-2 items-center">
          <SimpleSelect
            options={["Small", "Medium", "Large", "Huge"]}
            defaultValue="Small"
            onChange={(value) => setSize(value as Size)}
          />
          <SimpleSelect
            options={["Low", "Medium", "High", "Impossible"]}
            defaultValue="Low"
            onChange={(value) => setDefLevel(value as DefenseLevel)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Label>Distance</Label>
          <Input
            type="number"
            placeholder="distance (km)"
            className="text-white"
            ref={distanceRef}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Button
            onClick={() => {
              const result = getAlgorithmResult(
                task.algorithmName,
                Number(distanceRef.current?.value),
                defLevel,
                size
              );
              if (secondsToCompleteRef.current)
                secondsToCompleteRef.current.value =
                  result.secondsToComplete.toString();
              if (probabilityRef.current)
                probabilityRef.current.value = result.probability.toString();
            }}
          >
            Calculate
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div>Randomize</div>

        <Button onClick={() => handleRandomize("easy")}>Easy</Button>
        <Button onClick={() => handleRandomize("medium")}>Medium</Button>
        <Button onClick={() => handleRandomize("hard")}>Hard</Button>
      </div>
      <div className="flex flex-col gap-2 w-48">
        <div className="">Stats (shown to player)</div>
        <Input
          type="number"
          placeholder="seconds"
          className="text-white"
          ref={secondsToCompleteRef}
        />
        <Input
          type="number"
          placeholder="probability"
          className="text-white"
          ref={probabilityRef}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          className="bg-blue-500"
          onClick={() =>
            resolveTaskAnalysis(task.id, {
              probability: Number(probabilityRef.current?.value),
              secondsToComplete: Number(secondsToCompleteRef.current?.value),
            })
          }
        >
          Send to Player
        </Button>
      </div>
    </div>
  );
};

const PendingPanel = ({ task }: { task: Task }) => {
  const { archiveTask } = useTaskActions();
  return (
    <div className="flex flex-col gap-2">
      <div>Waiting for player response...</div>
      <Button onClick={() => archiveTask(task.id)}>Archive</Button>
    </div>
  );
};

const DonePanel = ({ task }: { task: Task }) => {
  const { archiveTask } = useTaskActions();
  return (
    <div className="flex flex-col gap-2">
      <div>Task Completed</div>
      <div>Status: {task.status}</div>
      <div>
        <Button onClick={() => archiveTask(task.id)}>Archive</Button>
      </div>
    </div>
  );
};
