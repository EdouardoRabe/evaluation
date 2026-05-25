import { useEffect, useMemo, useState } from "react";
import orderService from "../backend/services/OderService"
import BOOrderRow from "../components/BOOrderRow";
import { formatDateInput, isDateInRange } from "../backend/utils/utils"
import "../css/pages/BOOrderList.css"

function BOOrderList() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [actionResult, setActionResult] = useState(null);
    const [minDate, setMinDate] = useState("");
    const [maxDate, setMaxDate] = useState("");
    const [edit, setEdit] = useState({
        orderId: null,
        orderStateId: "",
        dateUpdate: "",
    });

    const filteredOrders = useMemo(() => {
        const min = minDate ? new Date(minDate) : null;
        const max = maxDate ? new Date(maxDate) : null;

        return orders.filter((order) => {
            const orderDate = new Date(order?.dateAdd || order?.dateUpd || null);
            return isDateInRange(orderDate, min, max);
        });
    }, [orders, minDate, maxDate]);

    const handleChange = (orderId) => (e) => {
        const { name, value } = e.target;

        setEdit((prev) => ({
            ...prev,
            orderId,
            [name]: value,
        }));
    };

    const handleClick = async (orderId) => {
        const currentOrder = orders.find((order) => Number(order.id) === Number(orderId))
        const newStateId = edit.orderStateId || currentOrder?.currentState || ""
        const dateUpdate = edit.dateUpdate || formatDateInput(currentOrder?.dateUpd) || formatDateInput(currentOrder?.dateAdd)

        try {
            const result = await orderService.updateOrderState(orderId, newStateId, dateUpdate);
            setActionResult({
                success: true,
                orderId,
                orderStateId: newStateId,
                dateUpdate,
                message: `Commande ${orderId} mise à jour avec succès à l'état ${newStateId}.`,
                orderHistory: result?.orderHistory ?? null,
                rawResponse: result?.rawResponse ?? null,
            });
        } catch (error) {
            console.log("Erreur lors de la modification de l'état de la commande", error);
            setActionResult({
                success: false,
                orderId,
                orderStateId: newStateId,
                dateUpdate,
                message: `Erreur lors de la mise à jour de la commande ${orderId}.`,
                error: error?.message || "Erreur inconnue",
            });
        }

        console.log(
            "Modifier la commande " +
                orderId +
                " à l'état " +
                (newStateId ?? "") +
                " avec la date " +
                (dateUpdate ?? "")
        );
    };

    useEffect(()=>{
        const loadOrders = async () =>{
            setIsLoading(true);
            try {
                const data = await orderService.getOrderRows();
                setOrders(data);
                setIsLoading(false);
            } catch (error) {
                console.log('Erreur lors de la recuperation des commandes', error);
            }
        }
        loadOrders();
    },[]);
    

    return(
        <>
            <h1>Liste de tous les commandes</h1>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
                <label>
                    Date min :{" "}
                    <input
                        type="date"
                        value={minDate}
                        onChange={(e) => setMinDate(e.target.value)}
                    />
                </label>
                <label>
                    Date max :{" "}
                    <input
                        type="date"
                        value={maxDate}
                        onChange={(e) => setMaxDate(e.target.value)}
                    />
                </label>
            </div>
            {actionResult && (
                <div className={`bo-order-message ${actionResult.success ? "bo-order-message--success" : "bo-order-message--error"}`}>
                    <strong>{actionResult.success ? "Mise à jour réussie" : "Mise à jour impossible"}</strong>
                    <div>{actionResult.message}</div>
                    {actionResult.success ? (
                        <div className="bo-order-message__detail">
                            Dernier historique : {actionResult.orderHistory ? `ID ${actionResult.orderHistory.id} à ${actionResult.orderHistory.dateAdd}` : "Aucun historique trouvé"}
                        </div>
                    ) : (
                        <div className="bo-order-message__detail">Détail: {actionResult.error}</div>
                    )}
                </div>
            )}
            {isLoading ? (<p>Chargements des commandes</p>) : (
                <BOOrderRow
                    title="Commandes"
                    rows={filteredOrders}
                    edit={edit}
                    onChange={handleChange}
                    onClick={handleClick}
                />
            )}
        </>
    )

}
export default BOOrderList;