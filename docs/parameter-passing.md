# Passage de paramètres entre pages React Router

Guide pour passer des données entre pages dans une application React avec React Router.

## 4 méthodes principales

### 1. **URL Parameters** (pour ids uniques)
Idéal pour un seul paramètre identifiant une ressource (produit, commande, etc.)

#### Configuration de la route (App.jsx ou router/index.jsx)
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FOProductList from './pages/FOProductList'
import FOProductPreview from './pages/FOProductPreview'

<Routes>
  <Route path="/fo/products" element={<FOProductList />} />
  <Route path="/fo/product/:id" element={<FOProductPreview />} />
  <Route path="/fo/order/:orderId" element={<FOOrderDetail />} />
</Routes>
```

#### Envoi du paramètre
```jsx
import { useNavigate } from 'react-router-dom'

function FOProductList() {
  const navigate = useNavigate()

  const handleProductClick = (productId) => {
    navigate(`/fo/product/${productId}`)
  }

  return (
    <button onClick={() => handleProductClick(42)}>
      Voir produit 42
    </button>
  )
}
```

#### Récupération du paramètre
```jsx
import { useParams } from 'react-router-dom'

function FOProductPreview() {
  const { id } = useParams()  // id = "42"

  useEffect(() => {
    loadProduct(Number(id))
  }, [id])

  return <h1>Produit {id}</h1>
}
```

#### Plusieurs paramètres
```jsx
// Route
<Route path="/fo/order/:orderId/item/:itemId" element={<OrderItemDetail />} />

// Extraction
const { orderId, itemId } = useParams()
```

---

### 2. **Navigation State** (pour objets complexes)
Utile pour passer des données complexes sans les afficher dans l'URL. ⚠️ Disparaît au rafraîchir la page.

#### Envoi
```jsx
const navigate = useNavigate()

const handleDuplicateOrder = (order) => {
  navigate('/fo/cart', {
    state: {
      sourceOrderId: order.id,
      sourceOrderDate: order.dateAdd,
      multiplier: 2
    }
  })
}
```

#### Récupération
```jsx
import { useLocation } from 'react-router-dom'

function FOCart() {
  const location = useLocation()
  const source = location.state

  useEffect(() => {
    if (source?.sourceOrderId) {
      console.log(`Panier créé depuis commande ${source.sourceOrderId}`)
      console.log(`Multiplicateur: ${source.multiplier}`)
    }
  }, [source])

  return <div>...</div>
}
```

---

### 3. **Query Parameters** (pour filtres et tri)
Ideal pour filtres, pagination, tri. Les paramètres restent dans l'URL et survient au rafraîchir.

#### Envoi
```jsx
// Méthode 1: Navigation directe
navigate('/fo/products?category=5&sort=price&page=2')

// Méthode 2: URLSearchParams (plus propre)
const params = new URLSearchParams()
params.append('category', '5')
params.append('sort', 'price')
params.append('page', '2')
navigate(`/fo/products?${params.toString()}`)
```

#### Récupération (simple)
```jsx
import { useLocation } from 'react-router-dom'

function FOProductList() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  const category = params.get('category')  // "5"
  const sort = params.get('sort')          // "price"
  const page = params.get('page')          // "2"

  return <h1>Catégorie: {category}, Tri: {sort}</h1>
}
```

#### Récupération (with custom hook)
```jsx
function useQueryParams() {
  const location = useLocation()
  return new URLSearchParams(location.search)
}

// Utilisation
function FOProductList() {
  const params = useQueryParams()
  const itemsPerPage = params.get('pageSize') || '12'
  
  return <div>...</div>
}
```

---

### 4. **LocalStorage** (pour persistance)
Utiliser quand l'information doit survivre aux rafraîchissements et navigations.

#### Stockage
```jsx
const handleSaveCart = (cartData) => {
  localStorage.setItem('tempCart', JSON.stringify(cartData))
  navigate('/fo/checkout')
}
```

#### Récupération
```jsx
function FOCheckout() {
  useEffect(() => {
    const saved = localStorage.getItem('tempCart')
    if (saved) {
      const cartData = JSON.parse(saved)
      loadCart(cartData)
    }
  }, [])

  return <div>...</div>
}
```

---

## Cas d'usage: Passer l'ID d'une ligne Material React Table

### Scénario
Tu as une table avec des commandes. En cliquant un bouton dans une ligne, tu veux naviguer vers la page de détail avec l'ID de la commande.

### Approche 1: URL Parameter (recommandée pour un seul id)

```jsx
// Route
<Route path="/fo/order/:orderId" element={<FOOrderDetail />} />

// Table
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import { useNavigate } from 'react-router-dom'

function FOOrderList() {
  const navigate = useNavigate()

  const columns = useMemo(() => [
    {
      header: 'Référence',
      accessorKey: 'id',
    },
    {
      header: 'Date',
      accessorKey: 'dateAdd',
    },
    {
      header: 'Action',
      Cell: ({ row }) => (
        <button
          onClick={() => navigate(`/fo/order/${row.original.id}`)}
          type="button"
        >
          Voir détails
        </button>
      ),
    },
  ], [navigate])

  const table = useMaterialReactTable({
    columns,
    data: orders,
  })

  return <MaterialReactTable table={table} />
}

// Page de détail
function FOOrderDetail() {
  const { orderId } = useParams()

  useEffect(() => {
    loadOrder(Number(orderId))
  }, [orderId])

  return <h1>Commande {orderId}</h1>
}
```

### Approche 2: Navigation State (si tu veux passer l'objet entier)

```jsx
function FOOrderList() {
  const navigate = useNavigate()

  const columns = useMemo(() => [
    {
      header: 'Référence',
      accessorKey: 'id',
    },
    {
      header: 'Action',
      Cell: ({ row }) => (
        <button
          onClick={() => navigate(`/fo/order/${row.original.id}`, {
            state: {
              order: row.original,  // Passe l'objet entier
            }
          })}
          type="button"
        >
          Voir détails
        </button>
      ),
    },
  ], [navigate])

  // ...
}

// Page de détail
function FOOrderDetail() {
  const { orderId } = useParams()
  const location = useLocation()
  const order = location.state?.order

  return (
    <>
      <h1>Commande {orderId}</h1>
      {order && <p>Date: {order.dateAdd}</p>}
    </>
  )
}
```

### Approche 3: Plusieurs paramètres depuis la table

```jsx
// Route
<Route path="/fo/order/:orderId/item/:itemId" element={<OrderItemDetail />} />

// Table avec sous-lignes
const columns = useMemo(() => [
  {
    header: 'Produit',
    accessorKey: 'productName',
  },
  {
    header: 'Quantité',
    accessorKey: 'quantity',
  },
  {
    header: 'Action',
    Cell: ({ row, table }) => {
      // Accès au parent row si sous-ligne
      const parentId = row.parentId || row.original.id
      const itemId = row.original.id

      return (
        <button
          onClick={() => navigate(`/fo/order/${parentId}/item/${itemId}`)}
          type="button"
        >
          Détails
        </button>
      )
    },
  },
], [navigate])
```

---

## Exemple complet: Passer plusieurs paramètres avec filtres

```jsx
// Page source: Liste de commandes avec filtres
function FOOrderList() {
  const navigate = useNavigate()
  const [dateMin, setDateMin] = useState('')
  const [dateMax, setDateMax] = useState('')

  const handleViewOrder = (orderId) => {
    const params = new URLSearchParams()
    params.append('from', 'orderList')
    params.append('dateMin', dateMin)
    params.append('dateMax', dateMax)

    navigate(`/fo/order/${orderId}?${params.toString()}`)
  }

  return (
    <>
      <input
        type="date"
        value={dateMin}
        onChange={(e) => setDateMin(e.target.value)}
        placeholder="Date min"
      />
      <input
        type="date"
        value={dateMax}
        onChange={(e) => setDateMax(e.target.value)}
        placeholder="Date max"
      />
      {/* Table avec bouton qui utilise handleViewOrder */}
    </>
  )
}

// Page cible: Détail commande
function FOOrderDetail() {
  const { orderId } = useParams()
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  const from = params.get('from')        // "orderList"
  const dateMin = params.get('dateMin')  // "2026-05-01"
  const dateMax = params.get('dateMax')  // "2026-05-31"

  const handleBackToList = () => {
    navigate(`/fo/orders?dateMin=${dateMin}&dateMax=${dateMax}`)
  }

  return (
    <>
      <h1>Commande {orderId}</h1>
      <button onClick={handleBackToList}>
        Retour à la liste
      </button>
    </>
  )
}
```

---

## Résumé: Quand utiliser quoi?

| Méthode | Cas d'usage | Survit au rafraîchir | Visible dans URL |
|---------|-------------|---------------------|------------------|
| **URL Params** | ID unique (produit, commande) | ✅ Oui | ✅ Oui |
| **Query Params** | Filtres, tri, pagination | ✅ Oui | ✅ Oui |
| **Navigation State** | Objets complexes, données temporaires | ❌ Non | ❌ Non |
| **LocalStorage** | Panier, préférences persistantes | ✅ Oui (longtemps) | ❌ Non |

---

## Bonnes pratiques

1. **Toujours valider les paramètres** quand tu les lis
   ```jsx
   const id = useParams().id
   if (!id || isNaN(Number(id))) {
     return <div>Paramètre invalide</div>
   }
   ```

2. **Utiliser des hooks personnalisés** pour simplifier
   ```jsx
   function useOrderId() {
     const { orderId } = useParams()
     return Number(orderId || 0)
   }
   ```

3. **Combiner URL Params + Query Params**
   ```jsx
   // Route: /fo/order/:orderId
   // URL complète: /fo/order/123?from=list&sort=date
   const { orderId } = useParams()
   const params = new URLSearchParams(location.search)
   ```
