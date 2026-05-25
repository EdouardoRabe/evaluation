import {useEffect, useState} from "react";
import Customer from "../backend/entities/Customer.js";
import FOUserRow from "../components/FOUserRow.jsx";
import useLocalStorage from "../hooks/useLocalStorage.jsx";
import CustomerService from "../backend/services/CustomerService.js";
import {useNavigate} from "react-router-dom";
import "../css/pages/FOUserList.css";

function FOUserList() {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useLocalStorage("user", null);
    const [isGuest, setIsGuest] = useLocalStorage("isGuest", false);
    const navigate = useNavigate();

    const ANONYMOUS_CUSTOMER_ID = [1,2];

    useEffect(() => {
        async function loadCustomers() {
            setIsLoading(true);

            try {
                const customer = new Customer({}, false);
                const data = await customer.getExclApi(ANONYMOUS_CUSTOMER_ID);

                setCustomers(data);
                setIsLoading(false);
            } catch (error) {
                console.error("ERROS WHILE FETCHING CUSTOMERS: " + error)
                return null;
            }
        }

        loadCustomers();
    }, []);

    const connectCustomer = (customer) => {
        setUser(customer);
        setIsGuest(false);
        navigate('/fo/products')
    }
    
    const connectGuest = () => {
        setUser({id: CustomerService.ANONYMOUS_ID});
        setIsGuest(true);
        navigate('/fo/products')
    }

    return (
        <div className="users-page">
            <h1>Se connecter avec un client</h1>
            <div className="users-shell">
                <div className="users-actions">
                    <button className="btn btn--primary anon-cta" type="button" onClick={() => connectGuest()}>
                        Connexion anonyme
                    </button>
                </div>

                {isLoading ? (
                    <p>Chargements des clients</p>
                ) : (
                    <div className="users-list">
                        {customers.map(customer => (
                            <FOUserRow
                                key={customer.id}
                                customer={customer}
                                onClick={() => connectCustomer(customer)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FOUserList;