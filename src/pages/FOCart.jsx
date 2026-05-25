import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import CartService from "../backend/services/CartService.js";
import Cart from "../backend/entities/Cart.js";
import Product from "../backend/entities/Product.js";
import CartWithDetails from "../backend/dto/CartWithDetails.js";
import OderService from "../backend/services/OderService.js";
import FOCartRow from "../components/FOCartRow.jsx";
import useLocalStorage from "../hooks/useLocalStorage.jsx";
import "../css/pages/FOCart.css";

const getFirstImage = (images) => images?.[0] || "";

const getSelectedOptionImpact = (options, selectedOptionId) => {
    const normalizedSelectedOptionId = Number(selectedOptionId || 0);
    const selectedOption = (options || []).find((option) => Number(option.id) === normalizedSelectedOptionId) || null;
    return Number(selectedOption?.priceImpact || 0);
};

const mapDeclinaisonOptions = (values = []) => (
    values.map((value) => ({
        id: value.id,
        label: value.label,
        priceImpact: value.priceImpact,
    }))
);

function FOCart() {
    const [cart, setCart] = useState(null);
    const [rowDetails, setRowDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionResult, setActionResult] = useState(null);

    const [user] = useLocalStorage("user", null);
    const [isGuest] = useLocalStorage("isGuest", false);

    const navigate = useNavigate();

    const totals = useMemo(() => (
        CartService.getCartTotals({
            cartRows: rowDetails
        })
    ), [rowDetails]);

    const formatPrice = (value) => {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return "-";
        }
        return number.toFixed(2);
    };

    const getRowKey = (row, index) => {
        return `${row.productId}-${index}`;
    };

    const updateRow = (rowIndex, values) => {
        setRowDetails(prev =>
            prev.map((row, index) =>
                index === rowIndex ? {...row, ...values} : row
            )
        );
    };

    const persistCartRows = async (nextCartRows) => {
        try {
            const nextCart = Cart.fromData({
                ...cart,
                cartRows: nextCartRows,
            });

            setCart(nextCart);

            const updated = await nextCart.update();
            setCart(updated);

        } catch (error) {
            console.error("Error updating cart:", error);
        }
    };

    const updateCartRow = (cartRowIndex, values) => {
        const nextRows = cart.cartRows.map((row, index) =>
            index === cartRowIndex
                ? {...row, ...values}
                : row
        );

        persistCartRows(nextRows);
    };

    const handleOptionChange = async (rowIndex, nextId, cartRowIndex) => {
        updateRow(rowIndex, {
            selectedOptionId: nextId,
            selectedOptionImpact: getSelectedOptionImpact(rowDetails[rowIndex]?.options, nextId)
        });

        updateCartRow(cartRowIndex, {
            productAttributeId: nextId
        });

        try {
            const productId = rowDetails[rowIndex].productId;

            const stockQuantity =
                await CartService.getStockForProductAttribute(
                    productId,
                    nextId
                );

            updateRow(rowIndex, {stockQuantity});

        } catch (error) {
            console.error("Error stock:", error);
        }
    };

    const handleQuantityChange = (rowIndex, nextQty, cartRowIndex) => {
        const stock = Number(rowDetails[rowIndex].stockQuantity);
        const rawQty = Math.max(1, Number(nextQty));
        const quantity = stock > 0 ? Math.min(rawQty, stock) : rawQty;

        updateRow(rowIndex, {quantity});
        updateCartRow(cartRowIndex, {quantity});
    };

    const handleDeleteRow = async (rowIndex) => {
        try {
            const updated = await CartService.deleteItems(
                cart,
                rowIndex
            );

            if (!updated) {
                setCart(null);
                return;
            }

            setCart(updated);

            setRowDetails(prev =>
                prev.filter((_, index) =>
                    index !== rowIndex
                )
            );

        } catch (error) {
            console.error(
                "Error deleting row:",
                error
            );
        }
    };

    const handleCheckout = async () => {
        if (isGuest) {
            navigate("/fo/checkout");
            return;
        }

        try {
            await OderService.createOrderFromCart(cart, user.id, new Date(),0);
            setActionResult({
                success: true,
                message: "Commande créée avec succès. Redirection vers vos commandes en cours..."
            });
        } catch (error) {
            console.error(error);
            setActionResult({
                success: false,
                message: error?.message || "Erreur lors de la création de la commande."
            });
        }
    };

    useEffect(() => {
        if (!actionResult?.success) {
            return;
        }

        const timer = setTimeout(() => {
            navigate("/fo/orders");
        }, 2200);

        return () => clearTimeout(timer);
    }, [actionResult, navigate]);

    useEffect(() => {
        const loadDatas = async () => {
            try {
                setIsLoading(true);
                if (!user.id) {
                    setCart(null);
                    return;
                }
                const customerCart = await CartService.getLastCartByCustomer(user.id);
                if (!customerCart) {
                    setCart(null);
                    return;
                }
                const isActive =
                    await CartService.isCartActive(
                        customerCart.id
                    );
                if (!isActive) {
                    setCart(null);
                    return;
                }

                const enriched = await CartWithDetails
                    .fromCart(customerCart)
                    .enrich();

                const enrichedByKey = new Map();
                for (const enrichedRow of enriched.enrichedRows ?? []) {
                    const key = `${enrichedRow.productId}:${enrichedRow.productAttributeId}`;
                    if (!enrichedByKey.has(key)) {
                        enrichedByKey.set(key, enrichedRow);
                    }
                }

                const productCache = new Map();
                const getProduct = async (productId) => {
                    if (productCache.has(productId)) {
                        return productCache.get(productId);
                    }
                    const product = await new Product({}, false).getById(productId);
                    productCache.set(productId, product);
                    return product;
                };

                const cartRows = customerCart.cartRows ?? [];
                const rows = (await Promise.all(
                    cartRows.map(async (row, index) => {
                        const productId = Number(row?.productId);
                        const attributeId = Number(row?.productAttributeId || 0);
                        const key = `${productId}:${attributeId}`;
                        const enrichedRow = enrichedByKey.get(key);
                        if (!enrichedRow || !productId) {
                            return null;
                        }

                        const product = await getProduct(productId);
                        if (!product) {
                            return null;
                        }

                        const stockQuantity = await CartService.getStockForProductAttribute(
                            productId,
                            attributeId
                        );

                        const declinaisons = await product.getDeclinaisons();
                        const values = declinaisons?.values || [];
                        const productImages = await product.getImages();
                        const fallbackImage = getFirstImage(productImages);

                        const builtRow = {
                            productId,
                            productName: enrichedRow.productName,
                            productReference: product.reference,
                            productImageURL: enrichedRow.imageUrl || fallbackImage || "",
                            imageUrl: enrichedRow.imageUrl || fallbackImage || "",
                            quantity: row?.quantity,
                            baseTtcPrice: await product.getTtcPrice(),
                            taxRate: await product.getTax(),
                            options: mapDeclinaisonOptions(values),
                            selectedOptionId: attributeId,
                            selectedOptionImpact: getSelectedOptionImpact(mapDeclinaisonOptions(values), attributeId),
                            stockQuantity,
                            cartRowIndex: index
                        };

                        return builtRow;
                    })
                ))
                    .filter(Boolean);

                setCart(customerCart);
                setRowDetails(rows);

            } catch (error) {
                console.error(error);
                setCart(null);
                setRowDetails([]);

            } finally {
                setIsLoading(false);
            }
        };

        loadDatas();

    }, [user.id]);

    if (isLoading) {
        return <div className="fo-cart fo-cart--loading"><p>Chargement du panier...</p></div>;
    }

    if (!cart) {
        return (
            <div className="fo-cart">
                <div className="fo-cart__empty">
                    <p className="fo-cart__empty-title">Votre panier est vide</p>
                    <p className="fo-cart__empty-text">Commencez à ajouter des produits pour remplir votre panier.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fo-cart">
            <h1 className="fo-cart__title">Votre Panier</h1>

            {actionResult ? (
                <div className={`fo-cart__message fo-cart__message--${actionResult.success ? "success" : "error"}`}>
                    <strong>{actionResult.success ? "✓ Succès" : "✗ Erreur"}</strong>
                    <div>{actionResult.message}</div>
                </div>
            ) : null}

            {rowDetails.length === 0 ? (
                <div className="fo-cart__empty">
                    <p className="fo-cart__empty-title">Panier vide</p>
                    <p className="fo-cart__empty-text">Aucun produit dans votre panier pour le moment.</p>
                </div>
            ) : (
                <>
                    <div className="fo-cart__content">
                        <table className="fo-cart__table">
                            <thead>
                                <tr>
                                    <th className="fo-cart__header-image">Image</th>
                                    <th className="fo-cart__header-name">Produit</th>
                                    <th className="fo-cart__header-reference">Référence</th>
                                    <th className="fo-cart__header-declination">Déclinaison</th>
                                    <th className="fo-cart__header-stock">Stock</th>
                                    <th className="fo-cart__header-price">Prix HT</th>
                                    <th className="fo-cart__header-price">Prix TTC</th>
                                    <th className="fo-cart__header-quantity">Quantité</th>
                                    <th className="fo-cart__header-total">Total</th>
                                    <th className="fo-cart__header-actions">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {rowDetails.map((row, index) => (
                                    <FOCartRow
                                        key={getRowKey(row, index)}
                                        row={row}
                                        index={index}
                                        onOptionChange={handleOptionChange}
                                        onQuantityChange={handleQuantityChange}
                                        onDelete={handleDeleteRow}
                                        formatPrice={formatPrice}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="fo-cart__footer">
                        <div className="fo-cart__totals">
                            <div className="fo-cart__total-row">
                                <span className="fo-cart__total-label">Total HT</span>
                                <span className="fo-cart__total-value">{formatPrice(totals.totalHt)}€</span>
                            </div>
                            <div className="fo-cart__total-row">
                                <span className="fo-cart__total-label">Total TTC</span>
                                <span className="fo-cart__total-value fo-cart__total-value--ttc">{formatPrice(totals.totalTtc)}€</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleCheckout}
                            className="fo-cart__checkout-btn"
                        >
                            Commander
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default FOCart;