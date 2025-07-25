import { Provider } from 'react-redux';
import { Toaster } from "sonner";
import { BrowserRouter } from "react-router-dom";
import store from './redux/store';
import MainRouter from './router/MainRouter';
import { ActivityProvider } from '@/contexts/ActivityContext';
import { AuthProvider } from '@/contexts/AuthContext'; // 1. Import AuthProvider

const App = () => (
  <Provider store={store}>
    {/* 2. Nest the providers. The order usually doesn't matter. */}
    <AuthProvider>
      <ActivityProvider>
        <BrowserRouter>
          <MainRouter />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </ActivityProvider>
    </AuthProvider>
  </Provider>
);

export default App;