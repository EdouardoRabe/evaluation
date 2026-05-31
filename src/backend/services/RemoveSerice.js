import Product from "../entities/Product";
import StockAvailable from "../entities/StockAvailable";
import StockMvt from "../entities/StockMvt";
import { formatDateTime } from "../utils/utils";

export async function removeProductFromStock(idCategorie, quantity, limit =null, isAdd = false) {
    try {
        const productApi = new Product({}, false);
        const products = await productApi.getAll();
        const stockApi = new StockAvailable({}, false);
        const categorieDetails = [];
        console.log("idCategorie", idCategorie);
        console.log("quantity", quantity);

        let total =0;
        let total2 = 0;

   

        const filtersProdut = products.filter(product => String(product.idCategoryDefault) === String(idCategorie));
        console.log("filtersProdut", filtersProdut);


        for (const product of filtersProdut) {
                    
            let soustotal =0;
            let soustotal2 = 0;

            const productAvailable = product.associations.stockAvailables ?? [];

            const hasDeclination = product.associations?.combinations?.length > 0;

            console.log("has declination ",hasDeclination);



            console.log("productAvailable", productAvailable);

            for(const a of productAvailable) {
                const stock  = await stockApi.getById(a.id);

                const quantityActual =Number(stock.quantity ?? 0);

                let quantityTo = 0
                if(isAdd){
                    if (limit == null || Number(limit) === 0) {
                        quantityTo = Math.max(0, Number(quantity) || 0);
                    } else {
                        // Mode ADD plafonné: ne pas dépasser la limite
                        const maxCanAdd = Number(limit) - quantityActual;
                        quantityTo = Math.max(0, Math.min(Number(quantity) || 0, maxCanAdd));
                    }
                }
                else{
                    quantityTo = Math.max(0, Math.min(quantity, quantityActual));
                }

                console.log("quantityActual", quantityActual);


                console.log(" a product attribute", a.idProductAttribute);

                if (hasDeclination && a.idProductAttribute === 0) {
                    continue
                }   
                else{
                    const movement = StockMvt.fromData({
                        idStock: stock.id,
                        idProduct: product.id,
                        idProductAttribute: a.idProductAttribute,
                        physicalQuantity: quantityTo,
                        sign: isAdd ? 1 : -1,
                        idStockMvtReason: 2,
                        idEmployee: 1,
                        priceTe: 0,
                        dateAdd: formatDateTime(new Date()),
                     })
                     total += Number(quantity);
                     soustotal += Number(quantity);
                        if(isAdd){
                            total2 += quantityTo;
                            soustotal2 += quantityTo;
                        }
                        else{
                            total2 += Number(Math.min(quantity, quantityActual));
                            soustotal2 += Number(Math.min(quantity, quantityActual));
                        }

                     await movement.save()
                     const update = StockAvailable.fromData(stock);
                     update.quantity = isAdd ? ( quantityActual + quantityTo): ( quantityActual - quantityTo) ;
                     await update.update()
                }               
            }
                 
            categorieDetails.push({
                        categoryId: idCategorie,
                        productId: product.id,
                        productName: product.name ?? "",
                        quantity : Number(soustotal),
                        quantityUpdate : Number(soustotal2)
            })

            if(isAdd){
                    console.log("total -- Ho ampina", total);
                  console.log("total2 -- nampina", total2);
                  console.log("details", categorieDetails );
            }
            else{
                 console.log("total -- Ho fafana", total);
                  console.log("total2 -- Voafafa", total2);
                  console.log("details", categorieDetails );
            }
        }
        return {total: total, removed: total2, detail: categorieDetails}
    } catch (error) {
        console.error("Erreur lors de la suppression du produit du stock: " + error);
    }
}

export default {
    removeProductFromStock,
}