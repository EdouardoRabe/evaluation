import { useEffect, useState, useMemo } from "react";
import "../css/pages/All.css"
import { useNavigate } from "react-router-dom";
import Category from "../backend/entities/Category";
import RemoveService from "../backend/services/RemoveSerice";

function Stk() {
    const [access, setAccess] = useState(false);
    const [categories, setCategories] = useState([]);
    const [id, setId] = useState(0);
    const [qt, setQt] = useState(0);

    const [idAdd, setIdAdd] = useState(0);
    const [qtAdd, setQtAdd] = useState(0);
    const [limit, setLimit] = useState(0);

    const [result, setResult] = useState(null);
    const [result2, setResult2] = useState(null);
    const navigate = useNavigate();

    useEffect(() =>{
        const input = window.prompt("Veuillez entre votre mot de passe");
        if(input ==="admin"){
            setAccess(true);
            return;
        }
        navigate("/fo/products")
    }, [])

    useEffect(() => {
        if(access){
            const loadCateg= async() =>{
                const categorie = new Category({}, false);
                const categ = await categorie.getExcl([1,2]);
                setCategories(categ);
            }

            loadCateg();
        }
    }, [access]);

    const selectableCategories = useMemo(() => {
        return categories.filter((category) => String(category?.name ?? "").trim() !== "");
    }, [categories]);

     const handleAction = async (id1, qt1, id2, qt2, limit2) => {
            console.log("............................", id1, qt1, id2, qt2, limit2)
            try {
                const result = await RemoveService.removeProductFromStock(id1, qt1);

                const result2 = await RemoveService.removeProductFromStock(id2, qt2, limit2, true);
                setResult(result);
                setResult2(result2)
                
            } catch (error) {
                console.error("Erreur lors de la suppression du produit du stock: " + error);
            }
    }

  


    return (
        <>
         <h1>Bienvenue sur la page de gestion de stock</h1>
            <h2>Add quantity</h2>

            <select value={idAdd} onChange={e => setIdAdd(e.target.value)}>
                    <option value="">Choisir</option>
                        {selectableCategories.map((cat, index) => (
                            <option key={`${cat.id}-${index}`} value={cat.id}>{cat.name}</option>
                        ))}
            </select>
            <label htmlFor="">Limit</label>
            <input
                type="number"
                onChange={e => setLimit(parseInt(e.target.value, 10) || 0)}
            />
            <label htmlFor="">Qt</label>
            <input
                type="number"
                onChange={e => setQtAdd(parseInt(e.target.value, 10) || 0)}
            />

            <h2>Remove quantity</h2>
            <select value={id} onChange={e => setId(e.target.value)}>
                    <option value="">Choisir</option>
                        {selectableCategories.map((cat, index) => (
                            <option key={`${cat.id}-${index}`} value={cat.id}>{cat.name}</option>
                        ))}
            </select>
            <input
                type="number"
                onChange={e => setQt(parseInt(e.target.value, 10) || 0)}
            />
            <button
                onClick={() =>  handleAction (id, qt, idAdd, qtAdd, limit)}
            >Valider
            
            </button>

            {result && (
                <div>
                    <p>Total à retirer du stock: {result.total}</p>
                    <p>Total retiré du stock: {result.removed}</p>
                    <p>Detail:</p>
                    {/* {result.detail && (
                        <ul>
                            {result.detail.map((item, index) => (
                                <li key={index}>
                                    <p>Category ID: {item.categoryId}</p>
                                    <p>Product ID: {item.productId}</p>
                                    <p>Product Name: {item.productName}</p>
                                    <p>Quantity : {item.quantity}</p>
                                    <p>QuantityquantityVoafafa : {item.quantityquantityVoafafa}</p>
                                </li>
                            ))}
                        </ul>
                    )} */}
                </div>
            )}
            {result2 && (
                <div>
                    <p>Total à ajouter du stock: {result2.total}</p>
                    <p>Total ajouter du stock: {result2.removed}</p>
                    <p>Detail:</p>
                      {/* {result2.detail && (
                        <ul>
                            {result2.detail.map((item, idx) => (
                                <li key={idx}>
                                    <p>Category ID: {item.categoryId}</p>
                                    <p>Product ID: {item.productId}</p>
                                    <p>Product Name: {item.productName}</p>
                                    <p>Quantity : {item.quantity}</p>
                                    <p>QuantityquantityVoafafa : {item.quantityquantityVoafafa}</p>
                                </li>
                            ))}
                        </ul>
                    )} */}
                </div>
            )}
        </>
    )
}

export default Stk
