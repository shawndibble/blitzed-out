import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Room from '../Room';

export default function AuthenticatedApp() {
    return (
        <BrowserRouter>
            <Routes>
                <Route exact path="/" element={<Room />} />
                <Route path="/room/:id" element={<Room />} />
            </Routes>
        </BrowserRouter>
    );
}