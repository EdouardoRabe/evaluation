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
    const [isImporting, setIsImporting] = useState(false)
    const [skipImageImport, setSkipImageImport] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setImportError(null)
        setImportResult(null)
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
        } catch (error) {
            setImportError(error?.message ?? 'Erreur inconnue')
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
                {productFile && <p className="bo-import__file">{productFile.name}</p>}

                <label className="bo-import__field">
                    <span className="bo-import__label">Déclinaisons & Stock initiaux</span>
                    <input className="bo-import__input" type={"file"} accept={".csv"} onChange={(event) => setDeclinaisonFile(event.target.files?.[0] ?? null)} />
                </label>
                {declinaisonFile && <p className="bo-import__file">{declinaisonFile.name}</p>}

                <label className="bo-import__field">
                    <span className="bo-import__label">Clients & Commandes</span>
                    <input className="bo-import__input" type={"file"} accept={".csv"} onChange={(event) => setOrdersFile(event.target.files?.[0] ?? null)} />
                </label>
                {ordersFile && <p className="bo-import__file">{ordersFile.name}</p>}

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
                {imageZipFile && <p className="bo-import__file">{imageZipFile.name}</p>}

                <button className="bo-import__submit" type={"submit"} disabled={isImporting}>
                    {isImporting ? 'Import en cours...' : 'Importer'}
                </button>
            </div>

            {importError && <div className="bo-import__message bo-import__message--error">{importError}</div>}
            {importResult && <pre className="bo-import__result">{JSON.stringify(importResult, null, 2)}</pre>}
        </form>
    )
}

export default BOImport;