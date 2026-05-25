import Order from "../entities/Order.js"
import OrderDetail from "../entities/OrderDetail.js"
const ensureArray = (value) => {
    if (Array.isArray(value)) return value
    if (value) return [value]
    return []
}


class ClientWithDetails {
    constructor(
        client,
        orderCount = 0,
        totalSpent = 0,
        productBreakdown = []
    ) {
        this.id = client.id
        this.firstname = client.firstname
        this.lastname = client.lastname
        this.email = client.email
        this.dateAdd = client.dateAdd
        this.active = client.active

        this.orderCount = orderCount
        this.totalSpent = totalSpent
        this.productBreakdown = productBreakdown  // [{productId, productName, quantity, totalSpent}]
    }


    static async fromCustomer(customer) {
        const orderClass = new Order({}, false)
        const orders = await orderClass.getBy("customerId", customer.id)
        const orderList = ensureArray(orders)

        const orderCount = orderList.length

        let totalSpent = 0
        const productMap = new Map()

        const orderDetailClass = new OrderDetail({}, false)

        for (const order of orderList) {
            totalSpent += Number(order.totalPaidTaxExcl || order.totalPaid || 0)

            const details = await orderDetailClass.getBy("orderId", order.id)
            const detailsList = ensureArray(details)

            for (const detail of detailsList) {
                const productId = Number(detail.productId || 0)
                const key = productId
                const current = productMap.get(key) || {
                    productId,
                    productName: detail.productName || `Produit ${productId}`,
                    quantity: 0,
                    totalSpent: 0,
                }

                current.quantity += Number(detail.productQuantity || 0)
                current.totalSpent += Number(detail.totalPriceTaxExcl || detail.totalPriceTaxIncl || 0)

                productMap.set(key, current)
            }
        }

        const productBreakdown = Array.from(productMap.values())
            .sort((a, b) => b.quantity - a.quantity)

        return new ClientWithDetails(
            customer,
            orderCount,
            totalSpent,
            productBreakdown
        )
    }
}

export default ClientWithDetails
