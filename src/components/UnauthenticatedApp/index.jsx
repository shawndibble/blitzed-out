import { redirect } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './styles.css';

function UnauthenticatedApp() {
    const { login } = useAuth();

    async function handleSubmit(event) {
        event.preventDefault();

        await login();

        redirect("/");
    }

    return (
        <>
            <h2>Game Setup</h2>
            <div>
                <form method="post" onSubmit={handleSubmit}>
                    <label>
                        Display Name: <input type="text" name="displayName" required />
                    </label>

                    <hr />
                    
                    <button type="submit">
                        Access Game
                    </button>
                </form>
            </div>
        </>
    );
}

export { UnauthenticatedApp };