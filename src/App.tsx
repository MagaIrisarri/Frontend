import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home/Home';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import ParkingSearchPage from '../src/pages/Parking/ParkingSearch.js'
import ProfilePage from './pages/Profile/ProfilePage';
import VehicleManagement from './pages/Vehicle/VehicleManagement';
import VehicleRegister from './pages/Vehicle/VehicleRegister';
import { AppLayout } from './components/layout/appLayout.js';
import VehicleSelect from './pages/Vehicle/VehicleSelect.js';
import {ParkingSpaceMap} from './pages/ParkingSpace/ParkingSpaceMap.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<AppLayout />}>
          <Route path="/select-vehicle" element={<VehicleSelect />} />
          <Route path="/parking" element={<ParkingSearchPage />} />
          <Route path="/parkings/:id/reservar" element={<ParkingSpaceMap />} />
        </Route>

        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/vehicles" element={<VehicleManagement />} />
        <Route path="/vehicles/new" element={<VehicleRegister />} />

        


      </Routes>
    </BrowserRouter>
  );
}

export default App;