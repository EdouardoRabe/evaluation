import api from "../utils/api"
import { toJSON, toJSONList, toXML } from "../xml/taxXML"
import { buildApiFilterQuery } from "../utils/utils"

class Tax {
    endpoint = "taxes"

    constructor(xml, validate = true) {
        const data = toJSON(xml) || {};

        this.id = data.id ?? null
        this.rate = data.rate ?? null
        this.active = data.active ?? null
        this.deleted = data.deleted ?? false
        this.name = data.name ?? ""

        if (validate) {
            const missing = [];

            if (this.rate == null) {
                missing.push("rate");
            }

            if (!this.name) {
                missing.push("name");
            }

            if (missing.length > 0) {
                throw new Error(`Missing required fields: ${missing.join(", ")}`);
            }
        }
    }

    static fromJSON(JsonData, validate = true) {
        return new Tax(toXML(JsonData), validate)
    }

    static fromData(data) {
        const tax = Object.create(Tax.prototype)
        Object.assign(tax, data)
        tax.endpoint = Tax.prototype.endpoint ?? "taxes"
        return tax
    }

    async save() {
        const xml = await api.post(this.endpoint, toXML(this))
        return new Tax(xml)
    }

    async getById(id) {
        const xml = await api.get(`${this.endpoint}/${id}`)
        return new Tax(xml)
    }

    async getBy(fieldName, value = this[fieldName]) {
        if (value === undefined || value === null || value === "") return []
        const all = await this.getAll()
        let values
        if (Array.isArray(value)) values = value
        else if (value instanceof Set) values = Array.from(value)
        else values = [value]
        
        const normalized = new Set(values.map(String))
        return all.filter((item) => {
            const v = item[fieldName]
            if (v === undefined || v === null) return false
            if (Array.isArray(v)) return v.map(String).some((iv) => normalized.has(iv))
            return normalized.has(String(v))
        })
    }

    async getByNot(fieldName, value = this[fieldName]) {
        if (value === undefined || value === null || value === "") return await this.getAll()
        const all = await this.getAll()
        let values
        if (Array.isArray(value)) values = value
        else if (value instanceof Set) values = Array.from(value)
        else values = [value]
        
        const normalized = new Set(values.map(String))

        return all.filter((item) => {
            const v = item[fieldName]
            if (v === undefined || v === null) return true
            if (Array.isArray(v)) return !v.map(String).some((iv) => normalized.has(iv))
            return !normalized.has(String(v))
        })
    }

    async getByApi(fieldName, value = this[fieldName]) {
        const filter = buildApiFilterQuery(fieldName, value)

        if (!filter) {
            return []
        }

        const xml = await api.get(`${this.endpoint}?display=full${filter}`)
        const taxes = toJSONList(xml)

        return taxes.map((data) => Tax.fromData(data))
    }

    async getByNotApi(fieldName, value = this[fieldName]) {
        let values
        if (Array.isArray(value)) values = value
        else if (value instanceof Set) values = Array.from(value)
        else values = [value]
        const normalized = values.map((v) => String(v).trim()).filter((s) => s !== "")

        if (normalized.length === 0) return []

        const filter = `&filter[${fieldName}]=![${normalized.join("|")}]`
        const xml = await api.get(`${this.endpoint}?display=full${filter}`)
        const taxes = toJSONList(xml)
        return taxes.map((data) => Tax.fromData(data))
    }

    async update() {
        if (!this.id) {
            throw new Error("Cannot update a tax without an ID")
        }

        const xml = await api.put(`${this.endpoint}/${this.id}`, toXML(this))
        return new Tax(xml)
    }

    async delete() {
        if (!this.id) {
            throw new Error("Cannot delete a tax without an ID")
        }

        await api.delete(`${this.endpoint}/${this.id}`)
    }

    // filtre cote client
    async getAll(excludeIds = []) {
        const excluded = new Set((excludeIds ?? []).map(Number))
        const xml = await api.get(`${this.endpoint}?display=full`)
        const taxes = toJSONList(xml)

        return taxes
            .filter((a) => !excluded.has(Number(a.id)))
            .map((a) => Tax.fromData(a))
    }

    // filtre cote API prestashop
    async getAllFiltered(excludeIds = []) {
        const ids = (excludeIds ?? []).map(Number).filter((id) => Number.isFinite(id))
        const filter = ids.length > 0 ? `&filter[id]=![${ids.join("|")}]` : ""
        const xml = await api.get(`${this.endpoint}?display=full${filter}`)
        const taxes = toJSONList(xml)

        return taxes.map((a) => Tax.fromData(a))
    }

    async getAllApi(excludeIds = []) {
        return await this.getAllFiltered(excludeIds)
    }

    async getExcl(excludeIds = []) {
        const excluded = new Set((excludeIds ?? []).map(Number))
        const all = await this.getAll()
        return all.filter((a) => !excluded.has(Number(a.id)))
    }

    async getIncl(includeIds = []) {
        const included = new Set((includeIds ?? []).map(Number))
        const all = await this.getAll()
        return all.filter((a) => included.has(Number(a.id)))
    }

    async getExclApi(excludeIds = []) {
        const ids = []
        for (const id of excludeIds ?? []) {
            const numericId = Number(id)

            if (Number.isFinite(numericId)) {
                ids.push(numericId)
            }
        }
        const filter = ids.length > 0 ? `&filter[id]=![${ids.join("|")}]` : ""
        const xml = await api.get(`${this.endpoint}?display=full${filter}`)
        const taxes = toJSONList(xml)
        return taxes.map((a) => Tax.fromData(a))
    }

    async getInclApi(includeIds = []) {
        const ids = []
        for (const id of includeIds ?? []) {
            const numericId = Number(id)

            if (Number.isFinite(numericId)) {
                ids.push(numericId)
            }
        }
        const filter = ids.length > 0 ? `&filter[id]=[${ids.join("|")}]` : ""
        const xml = await api.get(`${this.endpoint}?display=full${filter}`)
        const taxes = toJSONList(xml)
        return taxes.map((a) => Tax.fromData(a))
    }
}

export default Tax;