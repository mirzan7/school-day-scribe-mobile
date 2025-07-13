import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/NotFound";
import LoginScreen from "../components/auth/LoginScreen";
import PrivateRouter from "./PrivateRouter";
import PublicRouter from "./PublicRouter";   
import Home from "../pages/Home";

import Profile from "../pages/Profile";

const MainRouter = () => {
    return (
        <Routes>
            {/* Public Route: For unauthenticated users.
              If a logged-in user visits /login, PublicRouter should redirect them to /.
            */}
            <Route
                path="/login"
                element={
                    <PublicRouter>
                        <LoginScreen />
                    </PublicRouter>
                }
            />

            {/* Private Route: For authenticated users.
              If a logged-out user visits /, PrivateRouter should redirect them to /login.
            */}
            <Route
                path="/"
                element={
                    <PrivateRouter>
                        <Home />
                    </PrivateRouter>
                }
            />
            <Route
                path="/profile/"
                element={
                    <PrivateRouter>
                        <Profile/>
                    </PrivateRouter>
                }
                />

            {/* Catch-all for any other path */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default MainRouter;