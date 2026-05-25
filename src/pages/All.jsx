import { useEffect, useState, useMemo } from "react"
import Customer from "../backend/entities/Customer.js"
import ClientWithDetails from "../backend/dto/ClientWithDetails.js"
import { exportRowsToCSV, exportRowsToPDF } from "../backend/utils/exportUtils.js"
import "../css/pages/All.css"
const ensureArray = (value) => {
    if (Array.isArray(value)) return value
    if (value) return [value]
    return []
}

const clientExportColumns = [
    { label: "ID", value: (client) => client.id },
    { label: "Prénom", value: (client) => client.firstname },
    { label: "Nom", value: (client) => client.lastname },
    { label: "Email", value: (client) => client.email },
    { label: "Nb commandes", value: (client) => client.orderCount },
    { label: "Total dépensé", value: (client) => Number(client.totalSpent || 0).toFixed(2) },
    {
        label: "Produits achetés",
        value: (client) => (client.productBreakdown || [])
            .map((product) => `${product.quantity}x ${product.productName} (${Number(product.totalSpent || 0).toFixed(2)}€)`)
            .join(" | "),
    },
    {
        label: "Date d'inscription",
        value: (client) => client.dateAdd ? new Date(client.dateAdd).toLocaleDateString("fr-FR") : "",
    },
]


function All() {
    const [clients, setClients] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Filtres
    const [searchName, setSearchName] = useState("")
    const [minOrderCount, setMinOrderCount] = useState(0)
    const [minSpent, setMinSpent] = useState(0)

    useEffect(() => {
        const loadClients = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Récupérer tous les clients
                const customerClass = new Customer({}, false)
                const allCustomers = await customerClass.getAll()
                const customerList = ensureArray(allCustomers)

                // Enrichir chaque client
                const enrichedClients = []
                for (const customer of customerList) {
                    enrichedClients.push(await ClientWithDetails.fromCustomer(customer))
                }

                setClients(enrichedClients)
            } catch (err) {
                console.error("Erreur chargement clients:", err)
                setError(err.message || "Erreur lors du chargement des clients")
            } finally {
                setIsLoading(false)
            }
        }

        loadClients()
    }, [])

    // Filtrer les clients
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const fullName = `${client.firstname} ${client.lastname}`.toLowerCase()
            const matchesName = fullName.includes(searchName.toLowerCase())
            const matchesOrderCount = client.orderCount >= Number(minOrderCount || 0)
            const matchesSpent = client.totalSpent >= Number(minSpent || 0)

            return matchesName && matchesOrderCount && matchesSpent
        })
    }, [clients, searchName, minOrderCount, minSpent])

    // Calculer les stats globales
    const stats = useMemo(() => {
        return {
            totalClients: filteredClients.length,
            totalOrders: filteredClients.reduce((sum, c) => sum + c.orderCount, 0),
            totalSpent: filteredClients.reduce((sum, c) => sum + c.totalSpent, 0),
            avgOrderPerClient: filteredClients.length > 0
                ? (filteredClients.reduce((sum, c) => sum + c.orderCount, 0) / filteredClients.length).toFixed(2)
                : 0,
            avgSpentPerClient: filteredClients.length > 0
                ? (filteredClients.reduce((sum, c) => sum + c.totalSpent, 0) / filteredClients.length).toFixed(2)
                : 0,
        }
    }, [filteredClients])

    const formatPrice = (value) => {
        const num = Number(value || 0)
        return num.toFixed(2)
    }

    const handleExportClientCSV = (client) => {
        exportRowsToCSV({
            rows: [client],
            columns: clientExportColumns,
            filename: `client-${client.id}-${client.lastname || "export"}`,
        })
    }

    const handleExportClientPDF = (client) => {
        exportRowsToPDF({
            rows: [client],
            columns: clientExportColumns,
            filename: `client-${client.id}-${client.lastname || "export"}`,
            title: `Client ${client.firstname || ""} ${client.lastname || ""}`.trim(),
        })
    }

    if (isLoading) {
        return <div className="all-page"><p>Chargement des clients...</p></div>
    }

    if (error) {
        return (
            <div className="all-page">
                <div className="all-page__error">
                    <strong>Erreur</strong>
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="all-page">
            <h1>Page d'Administration - Clients & Statistiques</h1>

            {/* Stats globales */}
            <section className="all-page__stats">
                <div className="all-page__stat-card">
                    <strong>Clients</strong>
                    <div className="all-page__stat-value">{stats.totalClients}</div>
                </div>
                <div className="all-page__stat-card">
                    <strong>Commandes totales</strong>
                    <div className="all-page__stat-value">{stats.totalOrders}</div>
                </div>
                <div className="all-page__stat-card">
                    <strong>Dépenses totales</strong>
                    <div className="all-page__stat-value">{formatPrice(stats.totalSpent)}€</div>
                </div>
                <div className="all-page__stat-card">
                    <strong>Moy. cmd/client</strong>
                    <div className="all-page__stat-value">{stats.avgOrderPerClient}</div>
                </div>
                <div className="all-page__stat-card">
                    <strong>Moy. dépense/client</strong>
                    <div className="all-page__stat-value">{formatPrice(stats.avgSpentPerClient)}€</div>
                </div>
            </section>

            {/* Filtres */}
            <section className="all-page__filters">
                <div className="all-page__filter-group">
                    <label htmlFor="filter-name">Nom du client</label>
                    <input
                        id="filter-name"
                        type="text"
                        placeholder="Rechercher..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                    />
                </div>
                <div className="all-page__filter-group">
                    <label htmlFor="filter-orders">Min. commandes</label>
                    <input
                        id="filter-orders"
                        type="number"
                        placeholder="0"
                        value={minOrderCount}
                        onChange={(e) => setMinOrderCount(e.target.value)}
                        min="0"
                    />
                </div>
                <div className="all-page__filter-group">
                    <label htmlFor="filter-spent">Min. dépenses (€)</label>
                    <input
                        id="filter-spent"
                        type="number"
                        placeholder="0"
                        value={minSpent}
                        onChange={(e) => setMinSpent(e.target.value)}
                        min="0"
                    />
                </div>
            </section>

            {/* Tableau clients */}
            <section className="all-page__table-section">
                <h2>Liste des Clients</h2>
                {filteredClients.length === 0 ? (
                    <div className="all-page__empty">Aucun client ne correspond aux filtres</div>
                ) : (
                    <div className="all-page__table-wrapper">
                        <table className="all-page__table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Prénom</th>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>Nb Commandes</th>
                                    <th>Total Dépensé</th>
                                    <th>Produits Achetés</th>
                                    <th>Date d'inscription</th>
                                    <th>Export</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map((client) => (
                                    <tr key={client.id}>
                                        <td>{client.id}</td>
                                        <td>{client.firstname}</td>
                                        <td>{client.lastname}</td>
                                        <td className="all-page__email">{client.email}</td>
                                        <td className="all-page__number">{client.orderCount}</td>
                                        <td className="all-page__number">{formatPrice(client.totalSpent)}€</td>
                                        <td className="all-page__products">
                                            {client.productBreakdown.length === 0 ? (
                                                <span className="all-page__no-products">—</span>
                                            ) : (
                                                <div className="all-page__product-list">
                                                    {client.productBreakdown.map((product, idx) => (
                                                        <div key={`${client.id}-${product.productId}`} className="all-page__product-item">
                                                            <span className="all-page__product-qty">{product.quantity}x</span>
                                                            <span className="all-page__product-name">{product.productName}</span>
                                                            <span className="all-page__product-cost">({formatPrice(product.totalSpent)}€)</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="all-page__date">{client.dateAdd ? new Date(client.dateAdd).toLocaleDateString('fr-FR') : '—'}</td>
                                        <td className="all-page__actions">
                                            <button type="button" className="all-page__action-btn" onClick={() => handleExportClientCSV(client)}>
                                                CSV
                                            </button>
                                            <button type="button" className="all-page__action-btn" onClick={() => handleExportClientPDF(client)}>
                                                PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}

export default All
