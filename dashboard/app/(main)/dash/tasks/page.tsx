import { getTasks } from "@/lib/actions/crawler.actions";
import TasksClient from "./tasks-client";
import { CrawlerTask } from "@/types";

export default async function TasksPage() {
  let initialTasks: CrawlerTask[] = [];
  let initialError: string | null = null;
  
  try {
    initialTasks = await getTasks();
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return <TasksClient initialTasks={initialTasks} initialError={initialError} />;
}
