import { toDate, isDateInRange } from "../utils/utils.js";

const ensureArray = (v) => {
    if (Array.isArray(v)) return v
    if (v) return [v]
    return []
}

export default class OrderWithDetails {
    /**
     * Construit un groupe commande + détails.
     * Le DTO sert de point d'entrée commun pour les traitements qui ont besoin des deux objets ensemble.
     * @param {object} order
     * @param {Array<object>} orderDetails
     */
    constructor(order = null, orderDetails = []) {
        this.order = order
        this.orderDetails = orderDetails
    }

    /**
     * Crée un OrderWithDetails à partir d'une seule commande en chargeant ses lignes.
     * Méthode utilitaire pour un chargement lazy d'une commande.
     * @param {object} order
     * @returns {Promise<OrderWithDetails>}
     */
    static async fromOrder(order) {
        if (!order || !order.id) return new OrderWithDetails(order, [])

        // importer dynamiquement OrderDetail pour éviter dépendances circulaires
        const OrderDetail = (await import("../entities/OrderDetail.js")).default
        const detailClass = new OrderDetail({}, false)
        const rawDetails = await detailClass.getBy("orderId", order.id)

        const details = ensureArray(rawDetails)

        return new OrderWithDetails(order, details)
    }

    /**
     * Regroupe les commandes avec leurs lignes de commande déjà chargées.
     * La fonction conserve uniquement les commandes qui possèdent au moins un détail.
     * @param {Array<object>} orders
     * @param {Array<object>} orderDetails
     * @returns {Array<OrderWithDetails>}
     */
    static groupOrdersWithDetails(orders = [], orderDetails = []) {
        if (!Array.isArray(orders) || orders.length === 0) return []

        // Étape 1: indexer les détails par identifiant de commande.
        const detailsByOrderId = new Map()
        for (const detail of orderDetails ?? []) {
            const orderId = Number(detail?.orderId)
            if (!Number.isFinite(orderId)) continue
            if (!detailsByOrderId.has(orderId)) {
                detailsByOrderId.set(orderId, [])
            }
            detailsByOrderId.get(orderId).push(detail)
        }

        // Étape 2: reconstruire une liste de couples commande + détails.
        const result = []
        for (const order of orders ?? []) {
            const orderId = Number(order?.id)
            if (!Number.isFinite(orderId)) continue
            const details = detailsByOrderId.get(orderId) ?? []
            if (details.length === 0) continue
            result.push(new OrderWithDetails(order, details))
        }

        return result
    }

    /**
     * Filtre les groupes commande + détails sur une plage de dates inclusive.
     * Le filtrage s'applique sur la date de la commande parente.
     * @param {Array<OrderWithDetails>} list
     * @param {string|Date} dateMin
     * @param {string|Date} dateMax
     * @returns {Array<OrderWithDetails>}
     */
    static filterGroupsByDate(list, dateMin = null, dateMax = null) {
        const src = Array.isArray(list) ? list : []
        if (src.length === 0) return []
        if (!dateMin && !dateMax) return src

        const minDate = toDate(dateMin ?? "")
        const maxDate = toDate(dateMax ?? "")

        return src.filter((item) =>
            isDateInRange(toDate(item?.order?.dateAdd ?? ""), minDate, maxDate)
        )
    }
}
