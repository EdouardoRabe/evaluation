import { useEffect, useMemo, useState } from "react"
import {
	aggregateDashboardRowsByDay,
	aggregateCartDashboardRowsByDay,
	countDashboardRows,
	filterDashboardRowsByDates,
	filterDashboardRowsByStatus,
	loadDashboardData,
	sumCartDashboardRowsTotals,
	sumDashboardRowsTotals,
} from "../backend/services/DashboardService.js"
import BODashboardTable from "../components/BODashboardTable.jsx"
import { formatAmount, getOrderStateLabel } from "../backend/utils/dashboardUtils.js"
import "../css/pages/BODashboard.css"

function BODashboard() {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")
	const [dashboardRows, setDashboardRows] = useState([])
	const [cartDashboardRows, setCartDashboardRows] = useState([])
	const [orderStates, setOrderStates] = useState([])
	const [dateMin, setDateMin] = useState("")
	const [dateMax, setDateMax] = useState("")
	const [statusId, setStatusId] = useState("all")

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true)
				setError("")

				const data = await loadDashboardData()
				setDashboardRows(data.dashboardRows ?? [])
				setCartDashboardRows(data.cartDashboardRows ?? [])
				setOrderStates((data.orderStates ?? []).filter((state) => Number(state?.id) !== 6))
			} catch (err) {
				setError(err?.message || "Erreur lors du chargement du dashboard")
			} finally {
				setLoading(false)
			}
		}

		load()
	}, [])

	const filteredRows = useMemo(() => {
		const byDate = filterDashboardRowsByDates(dashboardRows, dateMin, dateMax)
		return filterDashboardRowsByStatus(byDate, statusId)
	}, [dashboardRows, dateMin, dateMax, statusId])

	const dailyRows = useMemo(() => aggregateDashboardRowsByDay(filteredRows), [filteredRows])
	const totals = useMemo(() => sumDashboardRowsTotals(filteredRows), [filteredRows])
	const ordersCount = useMemo(() => countDashboardRows(filteredRows), [filteredRows])

	const filteredCartRows = useMemo(() => {
		return filterDashboardRowsByDates(cartDashboardRows, dateMin, dateMax)
	}, [cartDashboardRows, dateMin, dateMax])

	const cartDailyRows = useMemo(() => aggregateCartDashboardRowsByDay(filteredCartRows), [filteredCartRows])
	const cartTotals = useMemo(() => sumCartDashboardRowsTotals(filteredCartRows), [filteredCartRows])
	const cartCount = useMemo(() => countDashboardRows(filteredCartRows), [filteredCartRows])

	const generalCount = useMemo(() => ordersCount + cartCount, [ordersCount, cartCount])
	const generalTotalHT = useMemo(() => Number(totals.totalHT || 0) + Number(cartTotals.totalHT || 0), [totals, cartTotals])
	const generalTotalTTC = useMemo(() => Number(totals.totalTTC || 0) + Number(cartTotals.totalTTC || 0), [totals, cartTotals])

	const resetFilters = () => {
		setDateMin("")
		setDateMax("")
		setStatusId("all")
	}

	return (
		<div>
			<h1>Dashboard</h1>

			{loading && <p>Chargement...</p>}
			{!loading && error && <p>{error}</p>}

			{!loading && !error && (
				<div>
					<section className="dashboard-kpi">
						<div className="dashboard-kpi__card dashboard-kpi__card--orders">
							<div className="dashboard-kpi__label">Nombre de commandes</div>
							<strong className="dashboard-kpi__value">{ordersCount}</strong>
						</div>
						<div className="dashboard-kpi__card dashboard-kpi__card--orders">
							<div className="dashboard-kpi__label">Total HT commandes</div>
							<strong className="dashboard-kpi__value">{formatAmount(totals.totalHT)}</strong>
						</div>
						<div className="dashboard-kpi__card dashboard-kpi__card--orders">
							<div className="dashboard-kpi__label">Total TTC commandes</div>
							<strong className="dashboard-kpi__value">{formatAmount(totals.totalTTC)}</strong>
						</div>
						<div className="dashboard-kpi__card dashboard-kpi__card--carts">
							<div className="dashboard-kpi__label">Nombre de paniers sans commande</div>
							<strong className="dashboard-kpi__value">{cartCount}</strong>
						</div>
						<div className="dashboard-kpi__card dashboard-kpi__card--carts">
							<div className="dashboard-kpi__label">Total HT paniers</div>
							<strong className="dashboard-kpi__value">{formatAmount(cartTotals.totalHT)}</strong>
						</div>
						<div className="dashboard-kpi__card dashboard-kpi__card--carts">
							<div className="dashboard-kpi__label">Total TTC paniers</div>
							<strong className="dashboard-kpi__value">{formatAmount(cartTotals.totalTTC)}</strong>
						</div>
						<div className="dashboard-kpi__card dashboard-kpi__card--general">
							<div className="dashboard-kpi__label">Nb General</div>
							<strong className="dashboard-kpi__value">{generalCount}</strong>
						</div>
						<div className="dashboard-kpi__card dashboard-kpi__card--general">
							<div className="dashboard-kpi__label">Total HT General</div>
							<strong className="dashboard-kpi__value">{formatAmount(generalTotalHT)}</strong>
						</div>
						<div className="dashboard-kpi__card dashboard-kpi__card--general">
							<div className="dashboard-kpi__label">Total TTC General</div>
							<strong className="dashboard-kpi__value">{formatAmount(generalTotalTTC)}</strong>
						</div>
					</section>

					<section className="dashboard-filters">
						<label className="dashboard-filters__field">
							<div className="dashboard-filters__label">Date min</div>
							<input type="date" value={dateMin} onChange={(event) => setDateMin(event.target.value)} />
						</label>
						<label className="dashboard-filters__field">
							<div className="dashboard-filters__label">Date max</div>
							<input type="date" value={dateMax} onChange={(event) => setDateMax(event.target.value)} />
						</label>
						<label className="dashboard-filters__field">
							<div className="dashboard-filters__label">Status</div>
							<select value={statusId} onChange={(event) => setStatusId(event.target.value)}>
								<option value="all">Tous les statuts</option>
								{orderStates.map((state) => (
									<option key={state.id} value={state.id}>
										{getOrderStateLabel(state)}
									</option>
								))}
							</select>
						</label>
						<div className="dashboard-filters__actions">
							<div className="dashboard-filters__label dashboard-filters__label--placeholder">Action</div>
							<button className="dashboard-filters__reset" type="button" onClick={resetFilters}>Reset filtres</button>
						</div>
					</section>

					<section>
						<h3>Commandes journalières</h3>
						<BODashboardTable rows={dailyRows} />
					</section>

					<section>
						<h3>Paniers journaliers</h3>
						<BODashboardTable rows={cartDailyRows} countHeader="Paniers" countKey="cartsCount" />
					</section>
				</div>
			)}
		</div>
	)
}

export default BODashboard