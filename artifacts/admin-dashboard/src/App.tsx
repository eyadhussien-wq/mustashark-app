import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Lawyers from "./pages/lawyers";
import LawyerVerifications from "./pages/lawyer-verifications";
import Clients from "./pages/clients";
import Consultations from "./pages/consultations";
import Offices from "./pages/offices";
import Dues from "./pages/dues";
import DeletionRequests from "./pages/deletion-requests";
import ProfileChanges from "./pages/profile-changes";
import Reviews from "./pages/reviews";
import Disputes from "./pages/disputes";

// Set token getter for API client
setAuthTokenGetter(() => localStorage.getItem("admin_token"));

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/lawyers" component={Lawyers} />
      <Route path="/lawyer-verifications" component={LawyerVerifications} />
      <Route path="/clients" component={Clients} />
      <Route path="/consultations" component={Consultations} />
      <Route path="/offices" component={Offices} />
      <Route path="/dues" component={Dues} />
      <Route path="/deletion-requests" component={DeletionRequests} />
      <Route path="/profile-changes" component={ProfileChanges} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/disputes" component={Disputes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div dir="rtl" className="min-h-[100dvh] bg-background font-sans text-foreground">
            <Router />
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
