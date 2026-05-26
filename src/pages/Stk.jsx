import { useEffect, useState } from "react";
import "../css/pages/All.css"
import { useNavigate } from "react-router-dom";
import Category from "../backend/entities/Category";
import RemoveService from "../backend/services/RemoveSerice";

function Stk() {
    const [access, setAccess] = useState(false);
    const [categories, setCategories] = useState([]);
    const [id, setId] = useState(0);
    const [qt, setQt] = useState(0);
    const [result, setResult] = useState(null);
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

     const handleRemoveFromStock = async (idCategorie, quantity) => {
            try {
                const result = await RemoveService.removeProductFromStock(idCategorie, quantity);
                setResult(result);
            } catch (error) {
                console.error("Erreur lors de la suppression du produit du stock: " + error);
            }
    }

  


    return (
        <>
         <h1>Bienvenue sur la page de gestion de stock</h1>
            <select value={id} onChange={e => setId(e.target.value)}>
                    <option value="">Choisir</option>
                        {categories.map((cat, index) => (
                            <option key={`${cat.id}-${index}`} value={cat.id}>{cat.name}</option>
                        ))}
            </select>
            <input
                type="number"
                onChange={e => setQt(parseInt(e.target.value, 10) || 0)}
            />
            <button
                onClick={() =>  handleRemoveFromStock(id, qt)}
            >Valider</button>
            {result && (
                <div>
                    <p>Total à retirer du stock: {result.total}</p>
                    <p>Total retiré du stock: {result.removed}</p>
                </div>
            )}
        </>
    )
}

export default Stk
