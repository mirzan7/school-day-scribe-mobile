import { Routes, Route } from "react-router-dom";
// import Index from "../pages/Index";
import NotFound from "../pages/NotFound";
import LoginScreen from "../components/auth/LoginScreen";
import PrivateRouter from "./PrivateRouter";
import PublicRouter from "./PublicRouter";
import Home from "../pages/Home";
// import Inder from "../pages"

const MainRouter = () => {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <PublicRouter>
                        <LoginScreen />
                    </PublicRouter>
                }
            />
            <Route
                path="/"
                element={
                    <PublicRouter>
                        <Home />
                    </PublicRouter>
                }
            />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default MainRouter;
