import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import Product from "../backend/entities/Product.js";
import Category from "../backend/entities/Category.js";
import { filterProducts } from "../backend/services/ProductService.js";
import { Link } from 'react-router-dom';
import "../css/pages/FOProductList.css";

function FOProductList() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [imageUrls, setImageUrls] = useState({});
    const [badges, setBadges] = useState({});

    // filtres
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [categoryId, setCategoryId] = useState("");
    const [name, setName] = useState("");

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12; // 3 lignes × 4 colonnes

    const navigate = useNavigate();

    const handlePreview = (productId) => {
        navigate(`/fo/product/preview/${productId}`);
    };

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const product = new Product({}, false);
                const productList = await product.getAll();

                const nextImageUrls = {};
                const nextBadges = {};

                const enrichedProducts = await Promise.all(
                    productList.map(async (item) => {
                        const [images, quantity, badge, priceTtc, category] = await Promise.all([
                            item.getImages(),
                            item.getQuantity(),
                            item.getBadge(),
                            item.getTtcPrice(),
                            item.getCategory(),
                        ]);

                        item.quantity = quantity;
                        item.badge = badge;
                        item.priceTtc = priceTtc;
                        item.categoryName = category?.name ?? "";

                        nextImageUrls[item.id] = images[0] || "";
                        nextBadges[item.id] = badge;

                        return item;
                    })
                );

                setProducts(enrichedProducts);
                setImageUrls(nextImageUrls);
                setBadges(nextBadges);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };

        loadProducts();
    }, []);

    useEffect(() => {
        let isActive = true;

        const loadCategories = async () => {
            try {
                const categoryApi = new Category({}, false);
                const categoryList = await categoryApi.getExcl([1, 2]);
                const categorySet = new Set(categoryList.map((category) => category.id));
                if (isActive) {
                    setCategories(categoryList);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        loadCategories();

        return () => {
            isActive = false;
        };
    }, []);

    const filteredProducts = useMemo(() => {
        return filterProducts({
            products,
            minPrice,
            maxPrice,
            categoryId: categoryId || null,
            name
        });
    }, [products, minPrice, maxPrice, categoryId, name]);

    const selectableCategories = useMemo(() => {
        return categories.filter((category) => String(category?.name ?? "").trim() !== "");
    }, [categories]);

    // Pagination logic
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, endIndex);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="fo-product-list">
            <h1>Product List</h1>

            <Link to="/stk">Reset</Link>

            <div className="fo-product-list__filters">
                <div className="fo-product-list__filter-group">
                    <label htmlFor="filter-name">Name</label>
                    <input id="filter-name" placeholder="Search name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="fo-product-list__filter-group">
                    <label htmlFor="filter-min-price">Min price</label>
                    <input id="filter-min-price" placeholder="0" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} min={0} />
                </div>
                <div className="fo-product-list__filter-group">
                    <label htmlFor="filter-max-price">Max price</label>
                    <input id="filter-max-price" placeholder="9999" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} min={0} />
                </div>
                <div className="fo-product-list__filter-group">
                    <label htmlFor="filter-category">Category</label>
                    <select id="filter-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">All Categories</option>
                        {selectableCategories.map((category, index) => (
                            <option key={`${category.id}-${index}`} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="fo-product-list__grid">
                {paginatedProducts.map((product, index) => (
                    <button 
                        key={`${product.id}-${index}`}
                        className="fo-product-card"
                        onClick={() => handlePreview(product.id)}
                        type="button"
                        aria-label={`View ${product.name?.[0]?.value}`}
                    >
                        <div className="fo-product-card__image-wrapper">
                            {imageUrls[product.id] ? (
                                <img 
                                    src={imageUrls[product.id]} 
                                    alt={product.name?.[0]?.value}
                                    className="fo-product-card__image"
                                />
                            ) : (
                                <div className="fo-product-card__no-image">No image</div>
                            )}
                            
                            {badges[product.id] && (
                                <div 
                                    className="fo-product-card__badge"
                                    style={{ backgroundColor: badges[product.id].color || "#dd0000" }}
                                >
                                    {badges[product.id].label}
                                </div>
                            )}
                        </div>

                        <div className="fo-product-card__content">
                            <h3 className="fo-product-card__name">
                                {product.name?.[0]?.value}
                            </h3>
                            
                            <p className="fo-product-card__reference">
                                {product.reference}
                            </p>

                            <div className="fo-product-card__details">
                                <span className="fo-product-card__price">
                                    {Number(product.priceTtc ?? product.price).toFixed(2)}€
                                </span>
                                <span className="fo-product-card__stock">
                                    Stock: {product.quantity}
                                </span>
                            </div>

                            <p className="fo-product-card__category">
                                {product.categoryName || "—"}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="fo-product-list__pagination">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="fo-product-list__pagination-btn"
                    >
                        ← Précédent
                    </button>

                    <div className="fo-product-list__pagination-info">
                        Page {currentPage} sur {totalPages}
                    </div>

                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="fo-product-list__pagination-btn"
                    >
                        Suivant →
                    </button>
                </div>
            )}
        </div>
    );
}

export default FOProductList;