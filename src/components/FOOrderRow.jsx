import { useEffect, useMemo, useRef, useState } from "react"
import { MaterialReactTable, useMaterialReactTable } from "material-react-table"
import { formatDateInput, formatDateTime } from "../backend/utils/utils"
import "../css/components/FOOrderRow.css"

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

    const columns = useMemo(
        () => [
            {
                header: "REFERENCE",
                accessorKey: "id",
            },
            {
                header: "NOM",
                accessorKey: "customerName",
            },
            {
                header: "DATE",
                accessorFn: (row) => formatDateTime(row.dateAdd) || "N/A",
            },
            {
                header: "TOTAL",
                accessorFn: (row) => {
                    const total = Number(row?.totalPaid ?? row?.totals?.totalTtc ?? 0)
                    return Number.isFinite(total) ? total.toFixed(2) : "N/A"
                },
            },
            {
                header: "ETAT ACTUEL",
                accessorKey: "orderStateName",
            },
            {
                header: "ACTION",
                Cell: OrderActionCell,
            },
        ],
        [],
    )

    const table = useMaterialReactTable({
        columns,
        data: safeRows,
        meta: tableMeta,
        enablePagination: true,
        initialState: {
            pagination: { pageIndex: 0, pageSize: 10 },
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
