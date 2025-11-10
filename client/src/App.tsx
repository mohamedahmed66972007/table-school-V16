import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
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
      <ThemeProvider 
        attribute="class" 
        defaultTheme="light" 
        enableSystem={false}
        storageKey="school-schedule-theme"
        disableTransitionOnChange
      >
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
