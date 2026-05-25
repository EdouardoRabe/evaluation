import Papa from "papaparse"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const normalizeFilename = (filename, extension) => {
    const base = String(filename || "export")
        .trim()
        .replace(/[\\/:*?"<>|]+/g, "-")
        .replace(/\s+/g, "_")

    return base.toLowerCase().endsWith(`.${extension}`) ? base : `${base}.${extension}`
}

const toRowObject = (row, columns = []) => {
    return columns.reduce((accumulator, column) => {
        const label = column?.label || column?.key
        if (!label) {
            return accumulator
        }

        const value = typeof column?.value === "function"
            ? column.value(row)
            : row?.[column?.key]

        accumulator[label] = value ?? ""
        return accumulator
    }, {})
}

export const exportRowsToCSV = ({ rows = [], columns = [], filename = "export", delimiter = ";" }) => {
    const data = (Array.isArray(rows) ? rows : []).map((row) => toRowObject(row, columns))
    const csv = Papa.unparse(data, {
        delimiter,
        quotes: true,
        header: true,
        skipEmptyLines: true,
    })

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.href = url
    link.download = normalizeFilename(filename, "csv")
    link.click()

    URL.revokeObjectURL(url)
}

export const exportRowsToPDF = ({
    rows = [],
    columns = [],
    filename = "export",
    title = "Export",
    orientation = "landscape",
}) => {
    const bodyRows = (Array.isArray(rows) ? rows : []).map((row) =>
        columns.map((column) => {
            if (typeof column?.value === "function") {
                return String(column.value(row) ?? "")
            }

            return String(row?.[column?.key] ?? "")
        })
    )

    const doc = new jsPDF({ orientation })
    doc.setFontSize(14)
    doc.text(title, 14, 14)

    autoTable(doc, {
        startY: 20,
        head: [columns.map((column) => column?.label || column?.key || "")],
        body: bodyRows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [33, 37, 41] },
    })

    doc.save(normalizeFilename(filename, "pdf"))
}