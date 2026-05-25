import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import orderService from "../backend/services/OderService"
import cartService from "../backend/services/CartService.js"
import FOOrderRow from "../components/FOOrderRow"
import useLocalStorage from "../hooks/useLocalStorage.jsx"
import { formatDateInput, isDateInRange } from "../backend/utils/utils.js"
import "../css/pages/FOOrderList.css"

const getOrdersByCustomer = async (customerId) => {
    return await orderService.getOrderRowsByCustomer(customerId)
}

const getCartsByCustomer = async (customerId) => {
    const rawCarts = await cartService.getCartWithoutOrderByCustomer(customerId)
    return await cartService.enrichCarts(rawCarts)
}

function FOOrderList() {
    const [orders, setOrders] = useState([])
    const [carts, setCarts] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [user] = useLocalStorage("user", null)
    const [actionResult, setActionResult] = useState(null)
    const [minDate, setMinDate] = useState("")
    const [maxDate, setMaxDate] = useState("")
    const [cloneCount, setCloneCount] = useState(0)
    const [edit, setEdit] = useState({
        orderId: null,
        cartId: null,
        multiplicateur: 1,
        dateUpdate: "",
        cartDateOrder: "",
    })

    const handleChange = (id, isCart = false) => (event) => {
        const { name, value } = event.target
        const idKey = isCart ? "cartId" : "orderId"

        setEdit((prev) => {
            const isNewSelection = prev[idKey] !== id
            return {
                ...prev,
                [idKey]: id,
                [name]: value,
                // Réinitialiser les champs de modification si c'est une nouvelle ligne
                ...(isNewSelection && {
                    multiplicateur: 1,
                    dateUpdate: "",
                    cartDateOrder: "",
                }),
            }
        })
    }

    const handleClick = async (orderId) => {
        try {
            const result = await orderService.duplicateCart(orderId, edit?.multiplicateur ?? 1, edit?.dateUpdate || formatDateInput(new Date()))
            setActionResult({
                success: true,
                message: `Commande ${orderId} dupliquée avec succès. Nouveau panier: ${result?.cart?.id ?? "inconnu"}. Redirection vers le panier...`,
            })
        } catch (error) {
            console.log("Erreur lors de la duplication du panier de la commande", error)
            setActionResult({
                success: false,
                message: `Erreur lors de la duplication de la commande ${orderId}.`,
            })
        }
    }

    const handleCommanderClick = async (cartId) => {
        try {
            const commandDate = edit?.cartId === cartId
                ? (edit?.cartDateOrder || formatDateInput(new Date()))
                : formatDateInput(new Date())

            await orderService.createOrderFromCartId(cartId, user?.id || 0, commandDate)

            const userId = user?.id || 0
            const [nextOrders, nextCarts] = await Promise.all([
                getOrdersByCustomer(userId),
                getCartsByCustomer(userId),
            ])

            setOrders(nextOrders)
            setCarts(nextCarts)
            setEdit({ orderId: null, multiplicateur: 1, dateUpdate: "", cartId: null, cartDateOrder: "" })
            setActionResult({
                success: true,
                message: `Commande créée avec succès depuis le panier ${cartId}.`,
            })
        } catch (error) {
            console.error("Erreur création commande depuis panier", error)
            setActionResult({
                success: false,
                message: `Erreur lors de la création de la commande depuis le panier ${cartId}.`,
            })
        }
    }

    const navigate = useNavigate()

    useEffect(() => {
        if (!actionResult?.success) {
            return
        }

        const timer = setTimeout(() => {
            navigate("/fo/cart", { state: { cloneCount } })
        }, 2200)

        return () => clearTimeout(timer)
    }, [actionResult, navigate, cloneCount])

    useEffect(() => {
        const loadAll = async () => {
            setIsLoading(true)
            try {
                const userId = user?.id || 0
                const [nextOrders, nextCarts] = await Promise.all([
                    getOrdersByCustomer(userId),
                    getCartsByCustomer(userId),
                ])

                setOrders(nextOrders)
                setCarts(nextCarts)
            } catch (error) {
                console.log("Erreur lors de la recuperation des donnees", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadAll()
    }, [user?.id])

    const cartRows = useMemo(
        () => (carts || []).map((cart) => ({
            ...cart,
            customerName: user?.firstname && user?.lastname
                ? `${user.firstname} ${user.lastname}`
                : "Panier (sans commande)",
            totalPaid: Number(cart?.totals?.totalTtc ?? 0),
            orderStateName: "En attente de commande",
        })),
        [carts, user],
    )

    const filteredOrders = useMemo(() => {
        const min = minDate ? new Date(minDate) : null
        const max = maxDate ? new Date(maxDate) : null

        return (orders || []).filter((order) => {
            const orderDate = new Date(order?.dateAdd || order?.dateUpd || null)
            return isDateInRange(orderDate, min, max)
        })
    }, [orders, minDate, maxDate])

    const filteredCartRows = useMemo(() => {
        const min = minDate ? new Date(minDate) : null
        const max = maxDate ? new Date(maxDate) : null

        return cartRows.filter((cart) => {
            const cartDate = new Date(cart?.dateAdd || cart?.dateUpd || null)
            return isDateInRange(cartDate, min, max)
        })
    }, [cartRows, minDate, maxDate])

    return (
        <div className="fo-order-list">
            <h1 className="fo-order-list__title">Liste de tous les commandes</h1>

            {actionResult ? (
                <div className={`fo-order-list__message fo-order-list__message--${actionResult.success ? "success" : "error"}`}>
                    <strong>{actionResult.success ? "✓ Succès" : "✗ Erreur"}</strong>
                    <div>{actionResult.message}</div>
                </div>
            ) : null}

            <div className="fo-order-list__filters">
                <div className="fo-order-list__filter-group">
                    <label htmlFor="fo-order-filter-min-date">Date min</label>
                    <input
                        id="fo-order-filter-min-date"
                        type="date"
                        value={minDate}
                        onChange={(e) => setMinDate(e.target.value)}
                    />
                </div>
                <div className="fo-order-list__filter-group">
                    <label htmlFor="fo-order-filter-max-date">Date max</label>
                    <input
                        id="fo-order-filter-max-date"
                        type="date"
                        value={maxDate}
                        onChange={(e) => setMaxDate(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <p>Chargement des clients</p>
            ) : (
                <FOOrderRow
                    title="Commandes"
                    rows={filteredOrders}
                    edit={edit}
                    multiplicateur={edit?.multiplicateur ?? 1}
                    onChange={handleChange}
                    onClick={handleClick}
                    actionMode="order"
                />
            )}

            <h2>Mes paniers sans commande</h2>

            {isLoading ? (
                <p>Chargement des paniers</p>
            ) : (
                <FOOrderRow
                    title="Paniers"
                    rows={filteredCartRows}
                    edit={edit}
                    onChange={handleChange}
                    onClick={handleCommanderClick}
                    actionMode="cart"
                />
            )}
        </div>
    )
}

export default FOOrderList
