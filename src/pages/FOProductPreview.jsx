import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Product from "../backend/entities/Product.js";
import CartService from "../backend/services/CartService.js";
import "../css/pages/FOProductPreview.css";

function FOProductPreview() {
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [declinaisons, setDeclinaisons] = useState(null);
    const [selectedDeclinaison, setSelectedDeclinaison] = useState(null);
    const [tax, setTax] = useState(0);
    const [ttcPrice, setTtcPrice] = useState(0);
    const [imageUrl, setImageUrl] = useState("");
    const [stockQuantity, setStockQuantity] = useState(null);
    const [badge, setBadge] = useState(null);

    const handleDeclinaisonChange = (e) => {
        const selectedId = Number(e.target.value);
        const selected = declinaisons?.values?.find((v) => v.id === selectedId) || null;
        setSelectedDeclinaison(selected);

        if (product?.id) {
            CartService.getStockForProductAttribute(product.id, selectedId)
                .then((qty) => setStockQuantity(qty))
                .catch((error) => {
                    console.error("Error fetching stock: ", error);
                });
        }
    };

    const handleAjouterPanier = () => {
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        const idCustomer = user?.id;

        if (!idCustomer) {
            alert("Veuillez vous connecter avant d'ajouter au panier.");
            return;
        }

        const idProductAttribute = selectedDeclinaison ? selectedDeclinaison.id : 0;

        CartService.addProductToCart(
            idCustomer, 
            product.id, 
            idProductAttribute, 
            quantity, 1).then(() => {
            alert("Produit ajouté au panier !");
        }).catch((error) => {
            console.error("Error adding to cart: ", error);
            alert("Erreur lors de l'ajout au panier.");
        });
    };


    const getDisplayedPrice = (baseTtc, taxRate, declinaison) => {
        const impactPrice = declinaison ? Number(declinaison.priceImpact || 0) : 0;
        const safeBase = Number.isFinite(Number(baseTtc)) ? Number(baseTtc) : 0;
        const safeTax = Number.isFinite(Number(taxRate)) ? Number(taxRate) : 0;
        return safeBase + impactPrice * (1 + safeTax / 100);
    };

    const displayedPrice = getDisplayedPrice(ttcPrice, tax, selectedDeclinaison);
    
    const getHtPrice = (ttc, taxRate) => {
        const safeTtc = Number.isFinite(Number(ttc)) ? Number(ttc) : 0;
        const safeTax = Number.isFinite(Number(taxRate)) ? Number(taxRate) : 0;
        return safeTtc / (1 + safeTax / 100);
    };

    const displayedHtPrice = getHtPrice(displayedPrice, tax);

    useEffect(() => {
        const loadProduct = async () => {
            setIsLoading(true);

            try {
                const productObject = new Product({}, false);

                const productData = await productObject.getById(id);
                setProduct(productData);

                const badgeData = productData.getBadge();
                setBadge(badgeData);

                const images = await productData.getImages();
                setImageUrl(images[0] || "");

                const taxRate = await productData.getTax();
                setTax(taxRate);

                const ttcPrice = await productData.getTtcPrice();
                setTtcPrice(ttcPrice);
                const data = await productData.getDeclinaisons();
                setDeclinaisons(data);
                if (data?.values?.length) {
                    setSelectedDeclinaison(data.values[0]);
                    const firstId = Number(data.values[0]?.id || 0);
                    const qty = await CartService.getStockForProductAttribute(productData.id, firstId);
                    setStockQuantity(qty);
                } else {
                    const qty = await CartService.getStockForProductAttribute(productData.id, 0);
                    setStockQuantity(qty);
                }

            } catch (error) {
                console.error("Error fetching products:", error);
            }

            setIsLoading(false);
        };

        loadProduct();
    }, [id]);

    if (isLoading) 
        return <div className="fo-product-preview fo-product-preview--loading"><p>Chargement...</p></div>;
    if (!product) 
        return <div className="fo-product-preview fo-product-preview--error"><p>Produit introuvable</p></div>;

    return (
        <div className="fo-product-preview">
            <div className="fo-product-preview__container">
                {/* IMAGE SECTION */}
                <div className="fo-product-preview__image-section">
                    <div className="fo-product-preview__image-wrapper">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={product.name?.[0]?.value}
                                className="fo-product-preview__image"
                            />
                        ) : (
                            <div className="fo-product-preview__no-image">No image</div>
                        )}
                        
                        {badge && (
                            <div 
                                className="fo-product-preview__badge"
                                style={{ backgroundColor: badge.color || "#dd0000" }}
                            >
                                {badge.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* DETAILS SECTION */}
                <div className="fo-product-preview__details-section">
                    <h1 className="fo-product-preview__name">
                        {product.name?.[0]?.value}
                    </h1>

                    <p className="fo-product-preview__reference">
                        Référence: <strong>{product.reference}</strong>
                    </p>

                    {/* PRICE SECTION */}
                    <div className="fo-product-preview__price-section">
                        <div className="fo-product-preview__price-item">
                            <span className="fo-product-preview__price-label">Prix HT</span>
                            <span className="fo-product-preview__price-value">
                                {displayedHtPrice.toFixed(2)}€
                            </span>
                        </div>
                        <div className="fo-product-preview__price-item fo-product-preview__price-item--ttc">
                            <span className="fo-product-preview__price-label">Prix TTC</span>
                            <span className="fo-product-preview__price-value">
                                {displayedPrice.toFixed(2)}€
                            </span>
                        </div>
                    </div>

                    {/* STOCK STATUS */}
                    <div className={`fo-product-preview__stock ${stockQuantity > 0 ? "fo-product-preview__stock--available" : "fo-product-preview__stock--unavailable"}`}>
                        Stock: <strong>{stockQuantity ?? "-"}</strong>
                    </div>

                    {/* DECLINATIONS */}
                    {declinaisons?.values?.length ? (
                        <div className="fo-product-preview__declination-section">
                            <label htmlFor="product-declination" className="fo-product-preview__declination-label">
                                Déclinaison
                            </label>
                            <select
                                id="product-declination"
                                className="fo-product-preview__declination-select"
                                onChange={handleDeclinaisonChange}
                                value={selectedDeclinaison?.id ?? declinaisons.values[0]?.id}
                            >
                                {declinaisons.values.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.label || ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    {/* QUANTITY SECTION */}
                    <div className="fo-product-preview__quantity-section">
                        <label htmlFor="product-quantity" className="fo-product-preview__quantity-label">Quantité</label>
                        <div className="fo-product-preview__quantity-control">
                            <button 
                                className="fo-product-preview__quantity-btn"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                type="button"
                                aria-label="Diminuer la quantité"
                            >
                                −
                            </button>
                            <input 
                                id="product-quantity"
                                type="number" 
                                value={quantity} 
                                readOnly 
                                min={1}
                                className="fo-product-preview__quantity-input"
                            />
                            <button
                                className="fo-product-preview__quantity-btn"
                                onClick={() => {
                                    const stock = Number(stockQuantity ?? 0);
                                    const next = quantity + 1;
                                    setQuantity(stock > 0 ? Math.min(next, stock) : next);
                                }}
                                type="button"
                                aria-label="Augmenter la quantité"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* ADD TO CART BUTTON */}
                    <button 
                        onClick={handleAjouterPanier}
                        className="fo-product-preview__add-cart-btn"
                        type="button"
                    >
                        Ajouter au panier
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FOProductPreview;