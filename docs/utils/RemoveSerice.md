import Product from "../entities/Product";
import StockAvailable from "../entities/StockAvailable";
import StockMvt from "../entities/StockMvt";
import { formatDateTime } from "../utils/utils";

// 🔧 MODIFICATION: Signature modifiée avec limite et isAdd
export async function removeProductFromStock(idCategorie, quantity, limite = null, isAdd = false) {
    try {
        const productApi = new Product({}, false);
        const products = await productApi.getAll();
        const stockApi = new StockAvailable({}, false);

        console.log("idCategorie", idCategorie);
        console.log("quantity", quantity);
        console.log("isAdd", isAdd);
        console.log("limite", limite);

        let total = 0;
        let total2 = 0;
        const categoryDetails = [];

        const filtersProdut = products.filter(product => String(product.idCategoryDefault) === String(idCategorie));
        console.log("filtersProdut", filtersProdut);

        for (const product of filtersProdut) {
            const productAvailable = product.associations.stockAvailables ?? [];

            const hasDeclination = product.associations?.combinations?.length > 0;

            console.log("has declination ", hasDeclination);

            console.log("productAvailable", productAvailable);

            for(const a of productAvailable) {
                const stock = await stockApi.getById(a.id);

                const quantityActual = Number(stock.quantity ?? 0);
                
                // 🔧 MODIFICATION: Logique différente pour ADD vs REMOVE
                let quantityToProcess = 0;
                
                if (isAdd) {
                    // Mode ADD: ajouter au stock avec vérification limite
                    const maxCanAdd = limite - quantityActual;
                    quantityToProcess = Math.max(0, Math.min(quantity, maxCanAdd));
                } else {
                    // Mode REMOVE: retirer du stock (logique originale)
                    quantityToProcess = Math.max(0, Math.min(quantity, quantityActual));
                }

                console.log("quantityActual", quantityActual);
                console.log("quantityToProcess", quantityToProcess);
                console.log("a product attribute", a.idProductAttribute);

                if (hasDeclination && a.idProductAttribute === 0) {
                    continue
                } else {
                    // 🔧 MODIFICATION: Sign inversé pour ADD (+1) vs REMOVE (-1)
                    const movement = StockMvt.fromData({
                        idStock: stock.id,
                        idProduct: product.id,
                        idProductAttribute: a.idProductAttribute,
                        physicalQuantity: quantityToProcess,
                        sign: isAdd ? 1 : -1,  // +1 pour ajouter, -1 pour retirer
                        idStockMvtReason: isAdd ? 1 : 2,  // Raison différente selon l'opération
                        idEmployee: 1,
                        priceTe: 0,
                        dateAdd: formatDateTime(new Date()),
                    })
                    
                    total += Number(quantity);
                    total2 += Number(quantityToProcess);
                    
                    await movement.save()
                    const update = StockAvailable.fromData(stock);
                    // 🔧 MODIFICATION: Opération inversée pour ADD vs REMOVE
                    const quantityAfter = isAdd
                        ? quantityActual + quantityToProcess
                        : quantityActual - quantityToProcess;

                    update.quantity = isAdd 
                        ? quantityAfter 
                        : quantityAfter;
                    await update.update()

                    // 🔧 MODIFICATION: Détail par produit dans la catégorie
                    categoryDetails.push({
                        categoryId: idCategorie,
                        productId: product.id,
                        productName: product.name?.[0]?.value ?? product.name ?? "",
                        stockId: stock.id,
                        productAttributeId: a.idProductAttribute,
                        quantityRequested: quantity,
                        quantityProcessed: quantityToProcess,
                        quantityBefore: quantityActual,
                        quantityAfter,
                        operation: isAdd ? "add" : "remove",
                    })
                }
            }
            console.log("total -- Demandé", total);
            console.log("total2 -- Traité", total2);
        }
        
        // 🔧 MODIFICATION: Retour détaillé par catégorie + produits traités
        return isAdd 
            ? { categoryId: idCategorie, operation: "add", details: categoryDetails }
            : { categoryId: idCategorie, operation: "remove", details: categoryDetails }
    } catch (error) {
        console.error("Erreur lors de la suppression du produit du stock: " + error);
    }
}

export default {
    removeProductFromStock,
}
