import Product from "../entities/Product";
import StockAvailable from "../entities/StockAvailable";
import StockMvt from "../entities/StockMvt";
import { formatDateTime } from "../utils/utils";

export async function removeProductFromStock(idCategorie, quantity) {
    try {
        const productApi = new Product({}, false);
        const products = await productApi.getAll();
        const stockApi = new StockAvailable({}, false);

        console.log("idCategorie", idCategorie);
        console.log("quantity", quantity);

        let total =0;
        let total2 = 0;

        const filtersProdut = products.filter(product => String(product.idCategoryDefault) === String(idCategorie));
        console.log("filtersProdut", filtersProdut);


        for (const product of filtersProdut) {
            const productAvailable = product.associations.stockAvailables ?? [];
            const hasDeclination = product.associations.combinations?.length > 0

            console.log("productAvailable", productAvailable);

            for(const a of productAvailable) {
                const stock  = await stockApi.getById(a.id);

                const quantityActual =Number(stock.quantity ?? 0);
                const quantityToRemove = Math.max(0, Math.min(quantity, quantityActual));
                console.log("quantityActual", quantityActual);
                console.log("quantityToRemove", quantityToRemove);
                total2 += Number(Math.min(quantity, quantityActual));
                if (hasDeclination && a.idProductAttribute === 0) {
                    continue
                }   
                else{
                    const movement = StockMvt.fromData({
                        idStock: stock.id,
                        idProduct: product.id,
                        idProductAttribute: a.idProductAttribute,
                        physicalQuantity: quantityToRemove,
                        sign: -1,
                        idStockMvtReason: 2,
                        idEmployee: 1,
                        priceTe: 0,
                        dateAdd: formatDateTime(new Date()),
                     })
                     total += Number(quantity);

                     await movement.save()
                     const update = StockAvailable.fromData(stock);
                     update.quantity = quantityActual - quantityToRemove;
                     await update.update()
                }
               
            }
            console.log("total -- Ho fafana", total);
            console.log("total2 -- Voafafa", total2);
        }
    } catch (error) {
        console.error("Erreur lors de la suppression du produit du stock: " + error);
    }
}

export default {
    removeProductFromStock,
}