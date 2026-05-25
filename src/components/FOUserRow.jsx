function FOUserRow({customer, onClick}) {
    return (
        <div className="user-card">
            <div className="user-card__info">
                <strong>{customer.firstname} {customer.lastname}</strong>
                <span className="user-card__meta">ID: {customer.id}</span>
                <span className="user-card__meta">{customer.email}</span>
            </div>
            <div className="user-card__actions">
                <button className="btn btn--ghost" type="button" onClick={onClick}>Se connecter</button>
            </div>
        </div>
    );
}

export default FOUserRow;