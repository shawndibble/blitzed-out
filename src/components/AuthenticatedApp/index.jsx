import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Room } from '../Room';
import { GameSettings } from '../GameSettings';

function AuthenticatedApp() {
    return (
        <BrowserRouter>
            <Routes>
                <Route exact path="/" element={<Room />} />
                <Route path="/room/:id" element={<Room />} />
                <Route path="/settings" element={<GameSettings />} />
            </Routes>
        </BrowserRouter>
    );
}

export { AuthenticatedApp };