import { useEffect, useState, useMemo } from "react";
import "../css/pages/All.css"
import { useNavigate } from "react-router-dom";
import Category from "../backend/entities/Category";
import RemoveService from "../backend/services/RemoveSerice";

function Stk() {
    const [access, setAccess] = useState(false);
    const [categories, setCategories] = useState([]);
    
    // 🔧 MODIFICATION: Ajout des états pour REMOVE
    const [idRemove, setIdRemove] = useState(0);
    const [qtRemove, setQtRemove] = useState(0);
    
    // 🔧 MODIFICATION: Ajout des états pour ADD
    const [idAdd, setIdAdd] = useState(0);
    const [qtAdd, setQtAdd] = useState(0);
    const [limite, setLimite] = useState(0);
    
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

    const selectableCategories = useMemo(() => {
        return categories.filter((category) => String(category?.name ?? "").trim() !== "");
    }, [categories]);

    // 🔧 MODIFICATION: Fonction handleValidate qui gère REMOVE et ADD
    const handleValidate = async () => {
        try {
            // Appel pour REMOVE
            const removeResult = await RemoveService.removeProductFromStock(idRemove, qtRemove, null, false);
            
            // Appel pour ADD
            const addResult = await RemoveService.removeProductFromStock(idAdd, qtAdd, limite, true);
            
            // Affichage du résultat combiné
            setResult({
                remove: removeResult,
                add: addResult
            });
        } catch (error) {
            console.error("Erreur lors de la validation: " + error);
        }
    }

    return (
        <>
            <h1>Bienvenue sur la page de gestion de stock</h1>
            
            {/* 🔧 MODIFICATION: Section REMOVE */}
            <div>
                <h2>Retirer du stock</h2>
                <select value={idRemove} onChange={e => setIdRemove(e.target.value)}>
                    <option value="">Choisir une catégorie</option>
                    {selectableCategories.map((cat, index) => (
                        <option key={`${cat.id}-${index}`} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <input
                    type="number"
                    placeholder="Quantité à retirer"
                    onChange={e => setQtRemove(parseInt(e.target.value, 10) || 0)}
                />
            </div>

            {/* 🔧 MODIFICATION: Section ADD */}
            <div>
                <h2>Ajouter au stock</h2>
                <select value={idAdd} onChange={e => setIdAdd(e.target.value)}>
                    <option value="">Choisir une catégorie</option>
                    {selectableCategories.map((cat, index) => (
                        <option key={`${cat.id}-${index}`} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <input
                    type="number"
                    placeholder="Quantité à ajouter"
                    onChange={e => setQtAdd(parseInt(e.target.value, 10) || 0)}
                />
                <input
                    type="number"
                    placeholder="Limite maximale du stock"
                    onChange={e => setLimite(parseInt(e.target.value, 10) || 0)}
                />
            </div>

            {/* 🔧 MODIFICATION: Bouton Valider unique pour les deux opérations */}
            <button onClick={handleValidate}>Valider</button>

            {result && (
                <div>
                    <h3>Résultats</h3>
                    {result.remove && (
                        <div>
                            <h4>Retrait du stock</h4>
                            <p>Catégorie: {result.remove.categoryId}</p>
                            {result.remove.details?.length > 0 ? (
                                result.remove.details.map((detail, index) => (
                                    <div key={`remove-${detail.productId}-${index}`}>
                                        <p>Produit: {detail.productName || detail.productId}</p>
                                        <p>Quantité demandée: {detail.quantityRequested}</p>
                                        <p>Quantité traitée: {detail.quantityProcessed}</p>
                                        <p>Stock avant: {detail.quantityBefore}</p>
                                        <p>Stock après: {detail.quantityAfter}</p>
                                    </div>
                                ))
                            ) : (
                                <p>Aucun détail disponible</p>
                            )}
                        </div>
                    )}
                    {result.add && (
                        <div>
                            <h4>Ajout au stock</h4>
                            <p>Catégorie: {result.add.categoryId}</p>
                            {result.add.details?.length > 0 ? (
                                result.add.details.map((detail, index) => (
                                    <div key={`add-${detail.productId}-${index}`}>
                                        <p>Produit: {detail.productName || detail.productId}</p>
                                        <p>Quantité demandée: {detail.quantityRequested}</p>
                                        <p>Quantité traitée: {detail.quantityProcessed}</p>
                                        <p>Stock avant: {detail.quantityBefore}</p>
                                        <p>Stock après: {detail.quantityAfter}</p>
                                    </div>
                                ))
                            ) : (
                                <p>Aucun détail disponible</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default Stk
