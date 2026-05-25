import {useState} from "react";
import executeImport from "../backend/services/import/executeImport.js";
import "../css/pages/BOImport.css"

function BOImport() {
    const [productFile, setProductFile] = useState(null)
    const [declinaisonFile, setDeclinaisonFile] = useState(null)
    const [ordersFile, setOrdersFile] = useState(null)
    const [imageZipFile, setImageZipFile] = useState(null)
    const [importResult, setImportResult] = useState(null)
    const [importError, setImportError] = useState(null)
    const [importMessage, setImportMessage] = useState(null)
    const [isImporting, setIsImporting] = useState(false)
    const [skipImageImport, setSkipImageImport] = useState(false)

    const buildImportSummary = (result) => {
        const parts = []
        if (result?.file1) parts.push("produits")
        if (result?.file2) parts.push("déclinaisons")
        if (result?.file3) parts.push("commandes")
        if (result?.file4) parts.push("images")

        return parts.length > 0
            ? `Import terminé avec succès: ${parts.join(", ")}.`
            : "Import terminé avec succès."
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setImportError(null)
        setImportResult(null)
        setImportMessage(null)
        setIsImporting(true)

        try {
            const result = await executeImport({
                productFile,
                declinaisonFile,
                ordersFile,
                imageZipFile,
                doImport: skipImageImport,
                onProgress: (progress) => console.log(progress),
            })

            setImportResult(result)
            setImportMessage(buildImportSummary(result))
        } catch (error) {
            setImportError(error?.message ?? 'Erreur inconnue')
            setImportMessage("L'import a échoué.")
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <form className="bo-import" onSubmit={handleSubmit}>
            <div className="bo-import__grid">
                <label className="bo-import__field">
                    <span className="bo-import__label">Produits</span>
                    <input className="bo-import__input" type={"file"} accept={".csv"} onChange={(event) => setProductFile(event.target.files?.[0] ?? null)} />
                </label>

                <label className="bo-import__field">
                    <span className="bo-import__label">Déclinaisons & Stock initiaux</span>
                    <input className="bo-import__input" type={"file"} accept={".csv"} onChange={(event) => setDeclinaisonFile(event.target.files?.[0] ?? null)} />
                </label>

                <label className="bo-import__field">
                    <span className="bo-import__label">Clients & Commandes</span>
                    <input className="bo-import__input" type={"file"} accept={".csv"} onChange={(event) => setOrdersFile(event.target.files?.[0] ?? null)} />
                </label>

                <label className="bo-import__field bo-import__field--images">
                    <span className="bo-import__label">Images</span>
                    <label className="bo-import__check">
                        <input
                            type="checkbox"
                            checked={skipImageImport}
                            onChange={(event) => setSkipImageImport(event.target.checked)}
                        />
                        <span>Ne pas importer les images</span>
                    </label>
                    <input
                        className="bo-import__input"
                        type={"file"}
                        accept={".zip"}
                        onChange={(event) => setImageZipFile(event.target.files?.[0] ?? null)}
                    />
                </label>

                <button className="bo-import__submit" type={"submit"} disabled={isImporting}>
                    {isImporting ? 'Import en cours...' : 'Importer'}
                </button>
            </div>

            {importMessage && (
                <div className={`bo-import__message ${importError ? "bo-import__message--error" : "bo-import__message--success"}`}>
                    <strong>{importError ? "Import impossible" : "Import réussi"}</strong>
                    <div>{importError || importMessage}</div>
                </div>
            )}
            {importResult && (
                <pre className="bo-import__result">{JSON.stringify(importResult, null, 2)}</pre>
            )}
        </form>
    )
}

export default BOImport;