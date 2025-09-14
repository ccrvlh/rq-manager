import { Home } from "@/pages/Home";
import { Jobs } from "@/pages/Jobs";
import { Queue } from "@/pages/Queue";
import { QueueDetails } from "@/pages/Queue/QueueDetails";
import { Scheduled } from "@/pages/Scheduled";
import { Settings } from "@/pages/Settings";
import { Workers } from "@/pages/Workers";
import { WorkerDetails } from "@/pages/Workers/WorkerDetails";
import { Route, Routes } from "react-router-dom";
import { routes } from ".";

export function AppRoutes() {
  return (
    <Routes>
      <Route id="home" path={routes.home} element={<Home />} />
      <Route id="jobs" path={routes.jobs} element={<Jobs />} />
      <Route id="scheduled" path={routes.scheduled} element={<Scheduled />} />
      <Route id="queue" path={routes.queue} element={<Queue />} />
      <Route
        id="queueDetails"
        path={routes.queueDetails}
        element={<QueueDetails />}
      />
      <Route id="settings" path={routes.settings} element={<Settings />} />
      <Route id="workers" path={routes.workers} element={<Workers />} />
      <Route
        id="workerDetails"
        path={routes.workerDetails}
        element={<WorkerDetails />}
      />
    </Routes>
  );
}
