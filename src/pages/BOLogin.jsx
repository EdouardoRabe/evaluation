import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/pages/BOLogin.css";

function BOLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('admin@gmail.com');
    const [password, setPassword] = useState('admin123');

    const checkCredentials = (email, password) => {
        if (email === 'admin@gmail.com' && password === 'admin123') {
            return true;
        }
        return false;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (checkCredentials(email, password)) {
            localStorage.setItem('boAuth', 'true');
            navigate('/orders', { replace: true }); 
        } else {
            alert('Email ou mot de passe incorrect.');
        }
    }

    return (
        <div className="login-shell">
            <div className="login-card">
                <h1>Connexion Backoffice</h1>
                <form onSubmit={handleSubmit}>
                    <input className="form-control" type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input className="form-control" type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button className="btn btn--primary" type="submit">Se connecter</button>
                </form>
                <div className="login-footer">Utilise admin@gmail.com / admin123 pour accéder au backoffice local</div>
            </div>
        </div>
    );
}

export default BOLogin;