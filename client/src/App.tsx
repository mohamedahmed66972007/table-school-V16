import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import Teachers from "@/pages/Teachers";
import TeacherSchedule from "@/pages/TeacherSchedule";
import MasterSchedule from "@/pages/MasterSchedule";
import Classes from "@/pages/Classes";
import TemplateSettings from "@/pages/TemplateSettings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/master-schedule" />
      </Route>
      <Route path="/teachers" component={Teachers} />
      <Route path="/teacher/:id" component={TeacherSchedule} />
      <Route path="/master-schedule" component={MasterSchedule} />
      <Route path="/classes" component={Classes} />
      <Route path="/template-settings" component={TemplateSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
