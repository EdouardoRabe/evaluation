import {Link, Navigate, Outlet, useLocation, useNavigate} from "react-router-dom";
import "../css/layouts/BOMainLayout.css";

function BOMainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthed = localStorage.getItem("boAuth") === "true";
    const isLoginRoute = location.pathname === "/";

    const handleLogout = () => {
        localStorage.removeItem("boAuth");
        navigate("/");
    };

    if (!isAuthed && !isLoginRoute) {
        return <Navigate to="/" replace />;
    }

    if (isLoginRoute) {
        return isAuthed ? <Navigate to="/orders" replace /> : <Outlet />;
    }

    return (
        <div className="bo-shell">
            <nav className="bo-nav">
                <div className="bo-nav__brand">
                    <span className="bo-nav__brand-mark" />
                    <span>Back Office</span>
                </div>
                <div className="bo-nav__links">
                    <Link className="bo-nav__link" to={"/reset"}> Reset </Link>
                    <Link className="bo-nav__link" to={"/import"}> Import </Link>
                    <Link className="bo-nav__link" to={"/stocks"}>Stocks</Link>
                    <Link className="bo-nav__link" to={"/orders"}> Orders </Link>
                    <Link className="bo-nav__link" to={"/statistics"}>Statistics</Link>
                    <Link className="bo-nav__link" to={"/dashboard"}>Dashboard</Link>
                    <button className="bo-nav__button" type="button" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <main>
                <Outlet/>
            </main>
        </div>
    )
}

export default BOMainLayout;