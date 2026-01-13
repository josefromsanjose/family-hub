import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle, User, Trophy, Flame } from "lucide-react";
import { useHousehold } from "../contexts/HouseholdContext";
import { useTasks, Task } from "../contexts/TasksContext";

export const Route = createFileRoute("/my-chores")({ component: MyChores });

function MyChores() {
  const { members } = useHousehold();
  const {
    tasks,
    completeTask,
    uncompleteTask,
    isTaskDue,
    getCompletionsThisPeriod,
    getCompletionStreak,
  } = useTasks();
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState<string>(
    members[0]?.name || ""
  );

  // Get recurring tasks assigned to selected member
  const myChores = tasks.filter(
    (task) => task.recurrence && task.assignedTo === selectedMember
  );

  const handleToggleChore = (task: Task) => {
    if (isTaskDue(task)) {
      completeTask(task.id, selectedMember);
    } else {
      uncompleteTask(task.id);
    }
  };

  const getChoreStatus = (task: Task) => {
    const isDue = isTaskDue(task);
    const periodCompletions = getCompletionsThisPeriod(task);
    const streak = getCompletionStreak(task);

    return {
      isDue,
      completions: periodCompletions.length,
      streak,
    };
  };

  const selectedMemberData = members.find((m) => m.name === selectedMember);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Chores</h1>
          <p className="text-gray-600 mb-4">
            Check off your chores as you complete them!
          </p>

          {/* Member Selector */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who are you?
            </label>
            <div className="flex gap-2 flex-wrap">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member.name)}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    selectedMember === member.name
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                      selectedMember === member.name
                        ? member.color || "bg-gray-500"
                        : member.color || "bg-gray-400"
                    }`}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{member.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {myChores.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
            <Circle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No chores assigned yet!
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedMember} doesn't have any recurring chores assigned.
            </p>
            <button
              onClick={() => navigate({ to: "/tasks" })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Tasks
            </button>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {myChores.filter((c) => isTaskDue(c)).length}
                </div>
                <div className="text-sm text-gray-600">Chores to do</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {myChores.filter((c) => !isTaskDue(c)).length}
                </div>
                <div className="text-sm text-gray-600">Done!</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-3xl font-bold text-orange-600 mb-1">
                  <Flame size={28} />
                  {Math.max(...myChores.map((c) => getCompletionStreak(c)), 0)}
                </div>
                <div className="text-sm text-gray-600">Best streak</div>
              </div>
            </div>

            {/* Chores List */}
            <div className="space-y-4">
              {myChores.map((chore) => {
                const status = getChoreStatus(chore);
                const isDue = status.isDue;

                return (
                  <div
                    key={chore.id}
                    className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all ${
                      isDue
                        ? "border-gray-300 hover:border-purple-400"
                        : "border-green-300 bg-green-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleChore(chore)}
                        className="flex-shrink-0 mt-1"
                        aria-label={isDue ? "Mark as done" : "Mark as not done"}
                      >
                        {isDue ? (
                          <Circle
                            size={32}
                            className="text-gray-400 hover:text-purple-600 transition-colors"
                            strokeWidth={2.5}
                          />
                        ) : (
                          <CheckCircle2
                            size={32}
                            className="text-green-600"
                            strokeWidth={2.5}
                          />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3
                              className={`text-xl font-bold mb-2 ${
                                isDue
                                  ? "text-gray-900"
                                  : "text-gray-600 line-through"
                              }`}
                            >
                              {chore.title}
                            </h3>
                            {chore.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {chore.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                    chore.recurrence === "daily"
                                      ? "bg-blue-100 text-blue-800"
                                      : chore.recurrence === "weekly"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  {chore.recurrence === "daily"
                                    ? "Daily"
                                    : chore.recurrence === "weekly"
                                      ? "Weekly"
                                      : "Monthly"}
                                </span>
                              </div>
                              {!isDue && status.completions > 0 && (
                                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                  <CheckCircle2 size={16} />
                                  <span>
                                    Done {status.completions} time
                                    {status.completions > 1
                                      ? "s"
                                      : ""} this{" "}
                                    {chore.recurrence === "daily"
                                      ? "today"
                                      : chore.recurrence === "weekly"
                                        ? "week"
                                        : "month"}
                                  </span>
                                </div>
                              )}
                              {status.streak > 0 && (
                                <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                                  <Flame size={16} />
                                  <span>
                                    {status.streak} day
                                    {status.streak > 1 ? "s" : ""} streak!
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completion Message */}
            {myChores.every((c) => !isTaskDue(c)) && (
              <div className="mt-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-center">
                <Trophy className="mx-auto h-16 w-16 text-white mb-3" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Awesome job, {selectedMember}! 🎉
                </h3>
                <p className="text-green-100">
                  All your chores are done! Keep up the great work!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
