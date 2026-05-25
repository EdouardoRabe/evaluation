import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import "../css/layouts/FOMainLayout.css";

function FOMainLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const isGuest = localStorage.getItem("isGuest") === "true";
    const isLoginRoute = location.pathname === "/fo";

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("isGuest");
        navigate("/fo");
    };

    if (isGuest) {
        return (
            <div className="fo-shell">
                <nav className="fo-nav">
                    <div className="fo-nav__brand">
                        <span className="fo-nav__brand-mark" />
                        <span>Shop</span>
                    </div>
                    <div className="fo-nav__links">
                        <Link className="fo-nav__link" to="/fo/products">Products</Link>
                        <Link className="fo-nav__link" to="/fo/cart">My cart</Link>
                        <button className="fo-nav__button" onClick={handleLogout}>Logout</button>
                    </div>
                </nav>

                <main>
                    <Outlet />
                </main>
            </div>
        );
    }

    if (isLoginRoute) {
        return <Outlet />;
    }

    return (
        <div className="fo-shell">
            <nav className="fo-nav">
                <div className="fo-nav__brand">
                    <span className="fo-nav__brand-mark" />
                    <span>Shop</span>
                </div>
                <div className="fo-nav__links">
                    <Link className="fo-nav__link" to="/fo/products">Products</Link>
                    <Link className="fo-nav__link" to="/fo/orders">My orders</Link>
                    <Link className="fo-nav__link" to="/fo/cart">My cart</Link>
                    <button className="fo-nav__button" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <main>
                <Outlet />
            </main>
        </div>
    );
}

export default FOMainLayout;