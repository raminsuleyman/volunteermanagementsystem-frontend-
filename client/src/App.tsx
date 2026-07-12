import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NewShift from "./pages/NewShift";
import ShiftBoard from "./pages/ShiftBoard";
import Volunteers from "./pages/Volunteers";
import Archive from "./pages/Archive";
import ArchiveDetail from "./pages/ArchiveDetail";


function Router() {
  return (
    <Layout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/novbe/yeni"} component={NewShift} />
        <Route path={"/novbe/board"} component={ShiftBoard} />
        <Route path={"/konulluler"} component={Volunteers} />
        <Route path={"/arxiv"} component={Archive} />
        <Route path={"/arxiv/:id"} component={ArchiveDetail} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
