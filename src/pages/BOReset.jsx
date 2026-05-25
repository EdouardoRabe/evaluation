import {useMemo, useState} from "react";
import {deleteAll, RESOURCES_TO_RESET} from "../backend/services/Reset.js";
import "../css/pages/BOReset.css"

function BOReset() {
    const [selected, setSelected] = useState(new Set());
    const [actionResult, setActionResult] = useState(null);
    const orderByValue = useMemo(() => {
        const orderMap = new Map();
        RESOURCES_TO_RESET.forEach((r) => orderMap.set(r.value, {
            order: r.order,
            description: r.description,
            value: r.value
        }));
        return orderMap;
    }, [])
    const isAllSelected = selected.size === RESOURCES_TO_RESET.length;
    
    const toggleItem = (key) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            console.log("reset key", key);
            const ordered = Array.from(next).sort((a, b) => {
                const orderA = orderByValue.get(a)?.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = orderByValue.get(b)?.order ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            });
            return new Set(ordered);
        });
    }

    const toggleAll = () => {
        if (isAllSelected) {
            setSelected(new Set());
        }
        else {
            const allKeys = RESOURCES_TO_RESET.map((r) => r.value);
            setSelected(new Set(allKeys));
        }
    }

    const doDelete = async () => {
        if (selected.size === 0) {
            setActionResult({
                success: false,
                message: "Sélectionne au moins une ressource avant de lancer la réinitialisation.",
            })
            return
        }

        try {
            setActionResult(null)
            await deleteAll(selected);
            setActionResult({
                success: true,
                message: `Réinitialisation terminée pour ${selected.size} ressource(s).`,
            })
            setSelected(new Set())
        } catch (error) {
            setActionResult({
                success: false,
                message: error?.message || "Erreur lors de la réinitialisation."
            })
        }
    }

    return (
        <div className="bo-reset">
            <div className="bo-reset__header">
                <h1>Réinitialisation</h1>
                <p>Sélectionne les ressources à vider, puis valide l’opération.</p>
            </div>

            {actionResult && (
                <div className={`bo-reset__message ${actionResult.success ? "bo-reset__message--success" : "bo-reset__message--error"}`}>
                    <strong>{actionResult.success ? "Réinitialisation réussie" : "Réinitialisation impossible"}</strong>
                    <div>{actionResult.message}</div>
                </div>
            )}

            <div className="bo-reset__panel">
                <div className="bo-reset__list">
                    {[...orderByValue.values()].map((resource) => (
                        <div className="bo-reset__item" key={resource.value}>
                            <input
                                id={`reset-${resource.value}`}
                                type="checkbox"
                                checked={selected.has(resource.value)}
                                onChange={() => toggleItem(resource.value)}
                            />
                            <label className="bo-reset__item-text" htmlFor={`reset-${resource.value}`}>
                                <strong>{resource.description}</strong>
                                <span>{resource.value}</span>
                            </label>
                        </div>
                    ))}
                </div>

                <div className="bo-reset__actions">
                    <button className="bo-reset__button bo-reset__button--ghost" type="button" onClick={toggleAll}>
                        {isAllSelected ? "Désélectionner tout" : "Sélectionner tout"}
                    </button>
                    <button className="bo-reset__button bo-reset__button--danger" type="button" onClick={doDelete} disabled={selected.size === 0}>
                        Valider
                    </button>
                </div>
            </div>
        </div>
    );

}

export default BOReset;