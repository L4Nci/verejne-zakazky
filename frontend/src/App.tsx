import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TendersPage } from '@/pages/TendersPage';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minut
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<TendersPage />} />
            <Route path="/tender/:id" element={<div>Detail zakázky (TODO)</div>} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
      <div className="min-h-screen bg-background text-foreground">
        <Header onToggleTheme={toggleTheme} isDark={isDark} />
        <main>
          <RouterProvider router={router} />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
