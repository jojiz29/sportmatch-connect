import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/ai-vision")({
  head: () => ({
    meta: [{ title: "Visión por Computadora — SportMatch" }],
  }),
  component: () => (
    <div className="flex-1 h-full min-h-[500px] w-full flex flex-col">
      <Outlet />
    </div>
  ),
});
