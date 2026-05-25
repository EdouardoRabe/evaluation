import { useEffect, useMemo, useRef, useState } from "react"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { formatDateInput, formatDateTime } from "../backend/utils/utils"
import "../css/components/FOOrderRow.css"
import OrderWithDetails from "../backend/dto/OrderWithDetails.js"

const noopValidator = () => null

function OrderMultiplicateurControl({ rowId, value, onChange }) {
    const [localValue, setLocalValue] = useState(String(value ?? 1))

    const commitValue = (nextValue) => {
        const normalizedValue = Math.max(1, Number(nextValue) || 1)
        setLocalValue(String(normalizedValue))
        onChange?.(rowId, false)({
            target: {
                name: "multiplicateur",
                value: normalizedValue,
            },
        })
    }

    const handleInputChange = (event) => {
        const nextValue = event.target.value.replace(/\D/g, "")
        setLocalValue(nextValue)

        if (nextValue === "") {
            return
        }

        onChange?.(rowId, false)({
            target: {
                name: "multiplicateur",
                value: Math.max(1, Number(nextValue) || 1),
            },
        })
    }

    return (
        <div className="fo-order-row__quantity-control">
            <button
                className="fo-order-row__quantity-btn fo-order-row__quantity-btn--minus"
                onClick={() => commitValue(Number(localValue || 1) - 1)}
                disabled={Number(localValue || 1) <= 1}
                aria-label="Diminuer le multiplicateur"
                type="button"
            >
                −
            </button>
            <input
                type="text"
                className="fo-order-row__quantity-input"
                value={localValue}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={handleInputChange}
                onFocus={(event) => event.target.select()}
                onClick={(event) => event.target.select()}
                aria-label="Multiplicateur"
            />
            <button
                className="fo-order-row__quantity-btn fo-order-row__quantity-btn--plus"
                onClick={() => commitValue(Number(localValue || 1) + 1)}
                aria-label="Augmenter le multiplicateur"
                type="button"
            >
                +
            </button>
        </div>
    )
}

function OrderActionCell({ cell, table }) {
    const meta = table?.options?.meta ?? {}
    const row = cell.row
    const rowId = Number(row.original?.id ?? 0)
    const edit = meta.edit ?? null
    const actionMode = meta.actionMode ?? "order"
    const isCartMode = actionMode === "cart"
    const isSelected = isCartMode ? Number(edit?.cartId ?? 0) === rowId : Number(edit?.orderId ?? 0) === rowId
    const baseDate = formatDateInput(row.original?.dateAdd)

    if (isCartMode) {
        const dateValue = isSelected ? (edit?.cartDateOrder || baseDate) : baseDate

        return (
            <div className="fo-order-row__actions">
                <input
                    type="date"
                    name="cartDateOrder"
                    className="fo-order-row__input"
                    onChange={meta.onChangeRef?.current?.(rowId, true)}
                    value={dateValue}
                />
                <button className="fo-order-row__button" type="button" onClick={() => meta.onClickRef?.current?.(rowId)}>
                    Commander
                </button>
            </div>
        )
    }

    const dateValue = isSelected ? (edit?.dateUpdate || baseDate) : baseDate
    const multiplicateur = meta.multiplicateur ?? 1
    const multiplicateurValue = isSelected ? (edit?.multiplicateur ?? multiplicateur) : multiplicateur

    return (
        <div className="fo-order-row__actions">
            <OrderMultiplicateurControl
                key={`${rowId}-${isSelected}`}
                rowId={rowId}
                value={multiplicateurValue}
                onChange={meta.onChangeRef?.current}
            />
            <input
                type="date"
                name="dateUpdate"
                className="fo-order-row__input"
                onChange={meta.onChangeRef?.current?.(rowId, false)}
                value={dateValue}
            />
            <button className="fo-order-row__button" type="button" onClick={() => meta.onClickRef?.current?.(rowId)}>
                Dupliquer la commande
            </button>
        </div>
    )
}

function FOOderRow({
    rows = [],
    edit = null,
    multiplicateur = 1,
    onChange,
    onClick,
    actionMode = "order",
    title = "",
}) {
    const safeRows = useMemo(() => (Array.isArray(rows) ? rows.filter(Boolean) : []), [rows])
    const editRef = useRef(edit)
    const onChangeRef = useRef(onChange)
    const onClickRef = useRef(onClick)
    const actionModeRef = useRef(actionMode)
    const multiplicateurRef = useRef(multiplicateur)

    useEffect(() => {
        editRef.current = edit
    }, [edit])

    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    useEffect(() => {
        onClickRef.current = onClick
    }, [onClick])

    useEffect(() => {
        actionModeRef.current = actionMode
    }, [actionMode])

    useEffect(() => {
        multiplicateurRef.current = multiplicateur
    }, [multiplicateur])

    const tableMeta = useMemo(
        () => ({
            edit,
            actionMode,
            multiplicateur,
            editRef,
            onChangeRef,
            onClickRef,
            actionModeRef,
            multiplicateurRef,
        }),
        [actionMode, edit, multiplicateur],
    )

    // Toggle this to false or comment out to disable order details fetch/display
    const ENABLE_ORDER_DETAILS = true

    const [detailsMap, setDetailsMap] = useState(() => new Map())
    const [loadingDetails, setLoadingDetails] = useState(() => new Set())
    const [checkedDetails, setCheckedDetails] = useState(() => ({}))

    const fetchOrderDetails = async (order) => {
        if (!order?.id) return null
        const id = Number(order.id)
        if (detailsMap.has(id)) return detailsMap.get(id)
        if (loadingDetails.has(id)) return null

        // mark loading
        setLoadingDetails((prev) => new Set(prev).add(id))
        try {
            const dto = await OrderWithDetails.fromOrder(order)
            setDetailsMap((prev) => {
                const next = new Map(prev)
                next.set(id, dto)
                return next
            })
            return dto
        } catch (err) {
            console.error("Error loading order details for", id, err)
            return null
        } finally {
            setLoadingDetails((prev) => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        }
    }

    const handleToggleDetail = (orderId, detailObj) => {
        setCheckedDetails((prev) => {
            const current = prev[orderId] ?? []
            const exists = current.some((d) => d.id === detailObj.id)
            return {
                ...prev,
                [orderId]: exists
                    ? current.filter((d) => d.id !== detailObj.id)
                    : [...current, { ...detailObj, multiplicateur: 1 }],
            }
        })
    }

    const handleUpdateMultiplicateur = (orderId, detailId, value) => {
        setCheckedDetails((prev) => {
            const current = prev[orderId] ?? []
            return {
                ...prev,
                [orderId]: current.map((d) =>
                    d.id === detailId ? { ...d, multiplicateur: Math.max(1, value) } : d
                ),
            }
        })
    }

    const columns = useMemo(
        () => [
            {
                header: "REFERENCE",
                accessorKey: "id",
                size: 90,
                minSize: 70,
                maxSize: 110,
            },
            {
                header: "NOM",
                accessorKey: "customerName",
                size: 240,
                minSize: 180,
            },
            {
                header: "DATE",
                accessorFn: (row) => formatDateTime(row.dateAdd) || "N/A",
                size: 150,
                minSize: 140,
            },
            {
                header: "TOTAL",
                accessorFn: (row) => {
                    const total = Number(row?.totalPaid ?? row?.totals?.totalTtc ?? 0)
                    return Number.isFinite(total) ? total.toFixed(2) : "N/A"
                },
                size: 110,
                minSize: 100,
            },
            {
                header: "ETAT ACTUEL",
                accessorKey: "orderStateName",
                size: 220,
                minSize: 180,
            },
            {
                header: "ACTION",
                Cell: OrderActionCell,
                size: 300,
                minSize: 280,
            },
        ],
        [],
    )

    const table = useMaterialReactTable({
        columns,
        data: safeRows,
        meta: tableMeta,
        enableRowDetail: ENABLE_ORDER_DETAILS,
        renderDetailPanel: ({ row }) => {
            if (!ENABLE_ORDER_DETAILS) return null

            const order = row.original
            const orderId = Number(order?.id)
            const dto = detailsMap.get(orderId)
            if (!dto) {
                // trigger fetch if not loaded
                fetchOrderDetails(order).catch(() => {})
                return (
                    <div className="fo-order-row__detail-panel">
                        Chargement des détails...
                    </div>
                )
            }

            return (
                <div className="fo-order-row__detail-panel">
                    <OrderDetailsSubrow
                        orderId={orderId}
                        orderWithDetails={dto}
                        checkedDetails={checkedDetails[orderId] ?? []}
                        onToggleDetail={(detailObj) => handleToggleDetail(orderId, detailObj)}
                        onUpdateMultiplicateur={(detailId, value) => handleUpdateMultiplicateur(orderId, detailId, value)}
                    />
                </div>
            )
        },
        enablePagination: true,
        layoutMode: "grid-no-grow",
        initialState: {
            pagination: { pageIndex: 0, pageSize: 10 },
        },
        muiTablePaperProps: {
            sx: {
                width: "100%",
            },
        },
        muiTableContainerProps: {
            sx: {
                width: "100%",
                overflowX: "auto",
            },
        },
        muiTableBodyRowProps: ({ row }) => ({
            sx: {
                backgroundColor: row.index % 2 === 0 ? "#fafafa" : "#ffffff",
            },
        }),
    })

    return (
        <section className="fo-order-row">
            {title ? <h3 className="fo-order-row__title">{title}</h3> : null}
            <MaterialReactTable table={table} />
        </section>
    )
}


function OrderDetailsSubrow({ orderId, orderWithDetails, checkedDetails = [], onToggleDetail, onUpdateMultiplicateur }) {
    const rows = orderWithDetails?.orderDetails || []

    if (!rows || rows.length === 0) {
        return <div className="fo-order-row__detail-empty">Aucun détail</div>
    }

    const handleDuplicate = () => {
        if (checkedDetails.length === 0) {
            alert("Veuillez sélectionner au moins un détail")
            return
        }
        alert(JSON.stringify({
            orderId,
            selectedDetails: checkedDetails,
        }, null, 2))
    }

    return (
        <div className="fo-order-details-container">
            <div className="fo-order-details-subrow">
                <div className="fo-order-details-subrow__header">
                    <span>☑️</span>
                    <span>Produit</span>
                    <span>Qté</span>
                    <span>Prix unitaire</span>
                    <span>Total</span>
                    <span>Mult.</span>
                </div>
                <div className="fo-order-details-subrow__rows">
                    {rows.map((d) => {
                        const checked = checkedDetails.find((cd) => cd.id === d.id)
                        const multiplicateur = checked?.multiplicateur ?? 1
                        return (
                            <div className="fo-order-details-subrow__row" key={d.id}>
                                <input
                                    type="checkbox"
                                    checked={!!checked}
                                    onChange={() => onToggleDetail(d)}
                                    className="fo-order-details-subrow__checkbox"
                                    aria-label={`Sélectionner ${d.productName}`}
                                />
                                <span className="fo-order-details-subrow__product" data-label="Produit">{d.productName || d.productReference || `#${d.productId}`}</span>
                                <span className="fo-order-details-subrow__qty" data-label="Qté">{d.productQuantity ?? d.quantity ?? 0}</span>
                                <span className="fo-order-details-subrow__price" data-label="Prix unitaire">{Number(d.unitPrice ?? d.unitPriceTaxIncl ?? d.unitPriceTaxExcl ?? 0).toFixed(2)}€</span>
                                <span className="fo-order-details-subrow__price" data-label="Total">{Number(d.totalPriceTaxIncl ?? d.totalPriceTaxExcl ?? 0).toFixed(2)}€</span>
                                {checked && (
                                    <input
                                        type="number"
                                        min="1"
                                        value={multiplicateur}
                                        onChange={(e) => onUpdateMultiplicateur(d.id, Number(e.target.value))}
                                        className="fo-order-details-subrow__multiplicateur"
                                        aria-label="Multiplicateur"
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            {checkedDetails.length > 0 && (
                <button
                    type="button"
                    onClick={handleDuplicate}
                    className="fo-order-details-duplicate-btn"
                >
                     Dupliquer ({checkedDetails.length})
                </button>
            )}
        </div>
    )
}

OrderActionCell.propTypes = {
    cell: noopValidator,
    table: noopValidator,
}

OrderMultiplicateurControl.propTypes = {
    rowId: noopValidator,
    value: noopValidator,
    onChange: noopValidator,
}

FOOderRow.propTypes = {
    rows: noopValidator,
    edit: noopValidator,
    multiplicateur: noopValidator,
    onChange: noopValidator,
    onClick: noopValidator,
    actionMode: noopValidator,
    title: noopValidator,
}

export default FOOderRow

OrderDetailsSubrow.propTypes = {
    orderId: noopValidator,
    orderWithDetails: noopValidator,
    checkedDetails: noopValidator,
    onToggleDetail: noopValidator,
    onUpdateMultiplicateur: noopValidator,
}
